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

class Consumer {
    constructor(option) {
        this.channel = option.channel;
        this.sleepTime = option.sleepTime || 3000;
        this.intervalInst = null;
        this.db = null;
        this.spiderType = option.spiderType || 'plain';
        this.userAgent = 'webster crawler (https://github.com/zhuyingda/webster)';
        this.deviceType = option.deviceType;
        this.redisConf = option.dbConf.redis;
    }
    async setup() {
        redis.connect({
            host: this.redisConf.host,
            port: this.redisConf.port,
            password: this.redisConf.password
        });
        this.waitUntilTask();
    }
    async waitUntilTask() {
        let firstTask = await this.getTaskFromQueue();
        if (firstTask === null) {
            this.intervalInst = setInterval(async function () {
                console.log('attemp to get task from queue');
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
                    console.log('task empty');
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
        await redis.hset({
            tableName: 'tmphash:' + this.channel,
            key: task.id,
            value: task
        });
        return task;
    }
    async setTaskFinish(taskId) {
        await redis.hdel({
            tableName: 'tmphash:' + this.channel,
            key: taskId
        });
        console.log(`task finish, id: ${taskId}`);
    }
    async afterGetTask(task) {
        let crawlResult = {};
        try {
            if (this.spiderType === 'plain') {
                crawlResult = await this.plainHttpRequest(task.url, task.targets);
            }
            else if (this.spiderType === 'browser') {
                crawlResult = await this.browserRequest(task.url, task.targets);
            }
        }
        catch (err) {
            crawlResult = {
                crawlError: err.toString()
            };
            console.error(err.toString());
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
        let html = await http({
            headers: {
                'User-Agent': this.userAgent
            },
            url: url
        });
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
        let html = await browser.request({
            url: url,
            userAgent: this.userAgent,
            viewPort: viewPortSet
        });
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
        console.log('crawl result: ', result);
    }
}

module.exports = Consumer;