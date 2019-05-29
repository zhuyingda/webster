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

/**
 * 从redis中读取网页抓取任务，并执行
 * @class
 */
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
        this.customHeaders = option.customHeaders || null;
        this.redisConf = option.dbConf.redis;
        if (!!option.delayTime) {
            this.delayTime = option.delayTime;
        }
        else {
            this.delayTime = 0;
        }
    }

    /**
     * 开始读取网页抓取任务，并执行
     */
    async startConsume() {
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
        let unfinishedTask = await this.getUnfinishedTasks();
        if (unfinishedTask) {
            await this.processUnfinishedTasks(unfinishedTask);
        }
        else {
            logger.info(`no unfinished task in channel: <${this.channel}> need to clean`);
        }
        this.waitUntilTask();
    }

    /**
     * 从redis中获取所有未完成的网页抓取任务
     */
    async getUnfinishedTasks() {
        logger.debug(`check if there is any unfinished task in channel: <${this.channel}>`);
        let unfinishedTasks = await redis.hgetall({
            tableName: 'tmphash:' + this.channel
        });
        if (unfinishedTasks.length === 0) {
            return null;
        }
        return unfinishedTasks;
    }

    /**
     * 处理抓取网页的任务
     */
    async processUnfinishedTasks(tasks) {
        logger.info(`channel: <${this.channel}> has undigested task to clean`);
        for (let task of tasks) {
            // 执行抓取任务
            let result = await this.execCrawlingTask(task);
            if (typeof result === 'object' && !!result.error) {
                // 任务执行失败后，从redis任务列表中删除任务，并日志记录任务失败
                await this.deleteFinishedTask(task.id);
                this.logFailedTask(task, result.msg);
            }
            else {
                // 任务执行成功后，从redis任务列表中删除任务
                await this.deleteFinishedTask(task.id);
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
            this.intervalInst = setInterval(async function () {
                logger.info(`attemp to get task from queue of channel <${this.channel}>`);
                let task = await this.getTaskFromQueue();
                if (task !== null) {
                    clearInterval(this.intervalInst);
                    let result = await this.execCrawlingTask(task);
                    if (typeof result === 'object' && !!result.error) {
                        await this.deleteFinishedTask(task.id);
                        this.logFailedTask(task, result.msg);
                        setTimeout(this.waitUntilTask.bind(this), this.sleepTime);
                    }
                    else {
                        await this.deleteFinishedTask(task.id);
                        this.waitUntilTask();
                    }
                }
                else {
                    logger.info('task queue is empty, sleep untill get task');
                }
            }.bind(this), this.sleepTime);
        }
        else {
            let result = await this.execCrawlingTask(firstTask);
            if (typeof result === 'object' && !!result.error) {
                await this.deleteFinishedTask(firstTask.id);
                this.logFailedTask(firstTask, result.msg);
                setTimeout(this.waitUntilTask.bind(this), this.sleepTime);
            }
            else {
                await this.deleteFinishedTask(firstTask.id);
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

    /**
     * 网页抓取任务完成后，从redis任务列表中删除该任务
     */
    async deleteFinishedTask(taskId) {
        await redis.hdel({
            tableName: 'tmphash:' + this.channel,
            key: taskId
        });
        logger.info(`task finish, id: ${taskId}`);
        return true;
    }

    /**
     * 网页抓取任务失败，日志记录
     */
    logFailedTask(task, reason) {
        logger.info(`task failed, id: ${task.taskId}`);
    }

    // 执行网页抓取
    async execCrawlingTask(task) {
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
            logger.fatal(`some unknown error during crawling: ${err.toString()}`);
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
            if (!!task.referInfo) {
                crawlResult.referInfo = task.referInfo;
            }
            let tmpSaveTask = await redis.hget({
                tableName: 'tmphash:' + this.channel,
                key: task.id
            });
            if (tmpSaveTask !== null) {
                this.afterCrawlRequest(crawlResult);
            }
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
        let headersParam= {
            'User-Agent': currentUserAgent
        };
        if (this.customHeaders) {
            Object.assign(headersParam, this.customHeaders);
        }
        let html = await http({
            headers: headersParam,
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

        let headersParam = {
            'User-Agent': currentUserAgent
        };
        if (this.customHeaders) {
            Object.assign(headersParam, this.customHeaders);
        }
        let delaySet = this.delayTime;
        let html = await browser.request({
            url: url,
            headers: headersParam,
            viewPort: viewPortSet,
            delay: delaySet
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