/**
 * Copyright (c) 2017 5u9ar (zhuyingda)
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const redis = require('./redis');
const http = require('./http');
const browser = require('./browser');
const JsDom = require('jsdom').JSDOM;
const VirtualConsole = require('jsdom').VirtualConsole;
const virtualConsole = new VirtualConsole();
const logger = require('log4js').getLogger('webster');
const defaultUserAgent = 'webster crawler (https://github.com/zhuyingda/webster)';

class Consumer {
    constructor(option) {
        this.channel = option.channel;
        this.sleepTime = option.sleepTime || 3000;
        this.intervalInst = null;
        this.db = null;
        this.userAgent = defaultUserAgent;
        if (!!option.userAgent) {
            this.userAgent = option.userAgent;
        }
        this.deviceType = option.deviceType;
        this.redisConf = option.dbConf.redis;
    }
    async setup() {
        logger.info(`webster consumer instance setup, connect to redis queue ${this.redisConf.host}`);
        try {
            redis.connect({
                host: this.redisConf.host,
                port: this.redisConf.port,
                password: this.redisConf.password
            });
        }
        catch (err) {
            logger.fatal(`redis connect failed, error message: ${err.toString()}`);
        }
        let unfinishedTask = await this.checkUnfinishedTask();
        if (unfinishedTask) {
            await this.cleanUnfinishedTask(unfinishedTask);
        }
        else {
            logger.info(`no unfinished task in channel: <${this.channel}> need to clean`);
        }
        this.waitUntilTask();
    }
    async checkUnfinishedTask() {
        logger.debug(`check if there is any unfinished task in channel: <${this.channel}>`);
        let unfinishedTasks = await redis.hgetall({
            tableName: 'tmphash:' + this.channel
        });
        if (unfinishedTasks.length === 0) {
            return null;
        }
        return unfinishedTasks;
    }
    async cleanUnfinishedTask(tasks) {
        logger.info(`start to clean unfinished task in channel: <${this.channel}>`);
        for (let task of tasks) {
            let result = await this.afterGetTask(task);
            if (typeof result === 'object' && !!result.error) {
                await this.setTaskFinish(task.id);
                this.whenTaskFailed(task, result.msg);
            }
            else {
                await this.setTaskFinish(task.id);
            }
        }
        logger.info(`unfinished task in channel: <${this.channel}> has cleaned`);
    }
    changeOption(option) {
        if (!!option.userAgent && typeof option.userAgent === 'string') {
            this.userAgent = option.userAgent;
        }
        if (!!option.sleepTime && typeof option.sleepTime === 'number') {
            this.sleepTime = option.sleepTime;
        }
    }
    async waitUntilTask() {
        let firstTask = await this.getTaskFromQueue();
        if (firstTask === null) {
            let hasSleepInfoLogShown = false;
            this.intervalInst = setInterval(async function () {
                if (!hasSleepInfoLogShown) {
                    logger.info(`attemp to get task from queue of channel <${this.channel}>`);
                    hasSleepInfoLogShown = true;
                }
                else {
                    logger.debug(`attemp to get task from queue of channel <${this.channel}>`);
                }
                let task = await this.getTaskFromQueue();
                if (task !== null) {
                    clearInterval(this.intervalInst);
                    let result = await this.afterGetTask(task);
                    if (typeof result === 'object' && !!result.error) {
                        await this.setTaskFinish(task.id);
                        this.whenTaskFailed(task, result.msg);
                        setTimeout(this.waitUntilTask.bind(this), this.sleepTime);
                    }
                    else {
                        await this.setTaskFinish(task.id);
                        this.waitUntilTask();
                    }
                }
                else {
                    if (!hasSleepInfoLogShown) {
                        logger.info('task queue is empty, sleep untill get task');
                        hasSleepInfoLogShown = true;
                    }
                    else {
                        logger.debug('task queue is empty, sleep untill get task');
                    }
                }
            }.bind(this), this.sleepTime);
        }
        else {
            let result = await this.afterGetTask(firstTask);
            if (typeof result === 'object' && !!result.error) {
                await this.setTaskFinish(firstTask.id);
                this.whenTaskFailed(firstTask, result.msg);
                setTimeout(this.waitUntilTask.bind(this), this.sleepTime);
            }
            else {
                await this.setTaskFinish(firstTask.id);
                this.waitUntilTask();
            }
        }
    }
    async getTaskFromQueue() {
        let task = await redis.lpop({
            tableName: 'queue:' + this.channel
        });
        if (task === null) {
            return null;
        }
        logger.debug(`task pop from queue ${this.channel}, task id: ${task.id}`);
        await redis.hset({
            tableName: 'tmphash:' + this.channel,
            key: task.id,
            value: task
        });
        logger.debug(`task is executing: ${task.id}`);
        return task;
    }
    async setTaskFinish(taskId) {
        await redis.hdel({
            tableName: 'tmphash:' + this.channel,
            key: taskId
        });
        logger.info(`task finish, id: ${taskId}`);
        return true;
    }
    whenTaskFailed(task, reason) {
        logger.info(`task failed, id: ${task.taskId}`);
    }
    async afterGetTask(task) {
        let crawlResult = {};
        try {
            if (task.spiderType === 'plain') {
                crawlResult = await this.plainHttpRequest(task.url, task.targets);
            }
            else if (task.spiderType === 'browser') {
                crawlResult = await this.browserRequest(task.url, task.targets);
            }
        }
        catch (err) {
            crawlResult = {
                crawlError: err.toString()
            };
            logger.warn(`some unknown error during crawling: ${err.toString()}`);
        }
        if (!!crawlResult.crawlError) {
            return {
                error: true,
                msg: 'unknown error'
            };
        }
        else if (crawlResult === 'crawl failed') {
            return {
                error: true,
                msg: 'crawl failed'
            };
        }
        else if (crawlResult === 'invalid html') {
            return {
                error: true,
                msg: 'invalid html'
            };
        }
        else {
            crawlResult.referInfo = task.referInfo;
            this.afterCrawlRequest(crawlResult);
            return true;
        }
    }
    async plainHttpRequest(url, targets) {
        logger.debug(`plain http request, url: ${url}`);
        let currentUserAgent = '';
        if (typeof this.userAgent === 'string') {
            currentUserAgent = this.userAgent;
        }
        else if (this.userAgent instanceof Array) {
            currentUserAgent = this.userAgent[Math.floor(Math.random() * this.userAgent.length)];
        }
        else {
            currentUserAgent = defaultUserAgent
        }
        let html = await http({
            headers: {
                'User-Agent': currentUserAgent
            },
            url: url
        });

        if (html === 'crawl failed') {
            logger.error(`plain http request failed, url: ${url}`);
            return 'crawl failed';
        }

        let isValidHtml = await this.beforeParseHtml(html);
        if (!isValidHtml) {
            logger.error(`plain http request got invalid result, url: ${url}`);
            return 'invalid html';
        }

        logger.debug(`plain http request has finished, url: ${url}`);
        let output = this.parseHtml(html, targets);
        return output;
    }
    async browserRequest(url, targets) {
        let viewPortSet = {};
        if (this.deviceType === 'mobile') {
            viewPortSet = {
                width: 320,
                height: 568,
                isMobile: true
            };
        }
        else if (this.deviceType === 'pc') {
            viewPortSet = {
                width: 1440,
                height: 960
            };
        }
        else {
            viewPortSet = {
                width: 1000,
                height: 1000
            };
        }
        logger.debug(`headless browser request, url: ${url}`);

        let currentUserAgent = '';
        if (typeof this.userAgent === 'string') {
            currentUserAgent = this.userAgent;
        }
        else if (this.userAgent instanceof Array) {
            currentUserAgent = this.userAgent[Math.floor(Math.random() * this.userAgent.length)];
        }
        else {
            currentUserAgent = defaultUserAgent
        }
        let html = await browser.request({
            url: url,
            userAgent: currentUserAgent,
            viewPort: viewPortSet
        });

        if (html === 'crawl failed') {
            logger.error(`headless browser request failed, url: ${url}`);
            return 'crawl failed';
        }

        let isValidHtml = await this.beforeParseHtml(html);
        if (!isValidHtml) {
            logger.error(`headless browser request got invalid result, url: ${url}`);
            return 'invalid html';
        }

        logger.debug(`headless browser request has finished, url: ${url}`);
        let output = this.parseHtml(html, targets);
        return output;
    }
    async beforeParseHtml(html) {
        logger.trace('hook before parse html method');
        return true;
    }
    parseHtml(html, targets) {
        let vdom = new JsDom(html, { virtualConsole });
        let document = vdom.window.document;
        let output = {};
        for (let target of targets) {
            let doms = document.querySelectorAll(target.selector);
            let targetResult = [];
            for (let idx = 0; idx < doms.length; idx++) {
                if (target.type === 'text') {
                    targetResult.push({
                        selector: target.selector,
                        text: doms[idx].textContent,
                        index: idx
                    });
                }
                else if (target.type === 'attr') {
                    targetResult.push({
                        selector: target.selector,
                        attrName: target.attrName,
                        attrValue: doms[idx].getAttribute(target.attrName),
                        index: idx
                    });
                }
                else if (target.type === 'html') {
                    targetResult.push({
                        selector: target.selector,
                        text: doms[idx].innerHTML,
                        index: idx
                    });
                }
            }
            output[target.field] = targetResult;
        }
        return output;
    }
    async afterCrawlRequest(result) {
        logger.info(`crawl result: ${result}`);
    }
}

module.exports = Consumer;