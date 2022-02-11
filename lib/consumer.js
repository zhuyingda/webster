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
const logger = require('log4js').getLogger('webster');
const defaultUserAgent = 'webster crawler (https://github.com/zhuyingda/webster)';
const Spider = require('./spider');

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
        this.ignoreUnfinishTask = !!option.ignoreUnfinishTask;
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
        if (!this.ignoreUnfinishTask) {
            let unfinishedTask = await this.getUnfinishedTasks();
            if (unfinishedTask) {
                await this.processUnfinishedTasks(unfinishedTask);
            }
            else {
                logger.info(`no unfinished task in channel: <${this.channel}> need to clean`);
            }
        }
        else {
            logger.info(`exist other crawler, so ignore unfinished task`);
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
                await this.handleFailedTask(task, result.msg);
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
                        this.handleFailedTask(task, result.msg);
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
                this.handleFailedTask(firstTask, result.msg);
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

    // 执行网页抓取
    async execCrawlingTask(task) {
        let sOpt = {
            type: task.spiderType,
            engine: task.engineType,
            browser: task.browserType,
            url: task.url,
            targets: task.targets,
            actions: task.actions,
            userAgent: task.userAgent,
            deviceType: task.deviceType,
            customHeaders: task.customHeaders
        };
        let spider = new Spider(sOpt);
        spider.parseHtml = this.beforeParseHtml;
        let crawlResult = await spider.startRequest();

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
    async beforeParseHtml(html) {
        logger.trace('hook before parse html method');
        return true;
    }
    async afterCrawlRequest(result) {
        logger.info(`crawl result: ${result}`);
    }
    async handleFailedTask(task, reason) {
        logger.info(`task failed, id: ${task.taskId}`);
    }
}

module.exports = Consumer;