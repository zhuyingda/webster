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
const logger = require('log4js').getLogger('webster');

class Consumer {
    constructor(option) {
        this.channel = option.channel;
        this.sleepTime = option.sleepTime || 3000;
        this.intervalInst = null;
        this.db = null;
        this.userAgent = 'webster crawler (https://github.com/zhuyingda/webster)';
        if (!!option.userAgent && typeof option.userAgent === 'string') {
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
        this.waitUntilTask();
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
                    let success = await this.afterGetTask(task);
                    if (success) {
                        this.setTaskFinish(task.id);
                    }
                    this.waitUntilTask();
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
            let success = await this.afterGetTask(firstTask);
            if (success) {
                this.setTaskFinish(firstTask.id);
            }
            this.waitUntilTask();
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
            logger.warn(`some error during crawling: ${err.toString()}`);
        }
        if (!crawlResult.crawlError) {
            this.afterCrawlRequest(crawlResult);
            return true;
        }
        else {
            return false;
        }
    }
    async plainHttpRequest(url, targets) {
        logger.debug(`plain http request, url: ${url}`);
        let html = await http({
            headers: {
                'User-Agent': this.userAgent
            },
            url: url
        });

        if (html === 'crawl failed') {
            logger.error(`plain http request failed, url: ${url}`);
            return 'crawl failed';
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
        let html = await browser.request({
            url: url,
            userAgent: this.userAgent,
            viewPort: viewPortSet
        });

        if (html === 'crawl failed') {
            logger.error(`headless browser request failed, url: ${url}`);
            return 'crawl failed';
        }

        logger.debug(`headless browser request has finished, url: ${url}`);
        let output = this.parseHtml(html, targets);
        return output;
    }
    parseHtml(html, targets) {
        let vdom = new JsDom(html);
        let document = vdom.window.document;
        let output = [];
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
            output.push({
                title: target.title,
                result: targetResult
            });
        }
        return output;
    }
    async afterCrawlRequest(result) {
        logger.info(`crawl result: ${result}`);
    }
}

module.exports = Consumer;