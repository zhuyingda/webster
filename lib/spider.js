/**
 * Copyright (c) 2020 5u9ar (zhuyingda)
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

const logger = require('log4js').getLogger('webster');
const http = require('./http');
const puppeteer = require('./browser/puppeteer');
const playwright = require('./browser/playwright');
const util = require('./util');
const JsDom = require('jsdom').JSDOM;
const VirtualConsole = require('jsdom').VirtualConsole;
const virtualConsole = new VirtualConsole();

class Spider {
    constructor(conf) {
        let option = Object.assign({}, conf);

        this.type = option.type || this.defType;
        if (this.type === 'browser') {
            this.engine = option.engine || this.defEngine;

            if (this.engine === 'playwright') {
                this.browser = option.browser || this.defBrowser;
            }

        }
        this.userAgent = option.userAgent || this.defUserAgent;
        this.url = option.url || '';
        this.targets = Array.isArray(option.targets) ? option.targets : [];
        this.actions = Array.isArray(option.actions) ? option.actions : [];
        this.deviceType = option.deviceType || this.defDeviceType;
        if (option.customHeaders && Object.keys(option.customHeaders).length > 0) {
            this.customHeaders = Object.assign({}, this.defCustomHeaders, option.customHeaders);
        }
        else {
            this.customHeaders = Object.assign({}, this.defCustomHeaders);
        }
        if (option.deviceWidth && option.deviceHeight) {
            this.deviceWidth = option.deviceWidth;
            this.deviceHeight = option.deviceHeight;
        }
        this.intruderMap = {};
        if (option.intruder) {
            for (const item of option.intruder) {
                this.intruderMap[item.url] = {
                    payload: item.payload,
                };
            }
        }
    }

    get defType() {
        return 'browser';
    }

    get defEngine() {
        return 'puppeteer';
    }

    get defBrowser() {
        return 'chromium';
    }

    get defDeviceType() {
        return 'pc';
    }

    get defUserAgent() {
        return 'webster crawler (https://github.com/zhuyingda/webster)';
    }

    get defCustomHeaders() {
        return {};
    }

    async parseHtml(html) {
        // 默认返回 true 如果需要自定义解析html判断是否valid逻辑可以override此方法
        return true;
    }

    async startRequest(url) {
        logger.trace(`start request url ${url} type: ${this.type}`);
        if (this.type !== 'plain') {
            logger.trace(`enhanced crawling mode by engine ${this.engine}`);
        }
        let crawlResult = {};
        let crawlerUrl = url || this.url;

        if (!crawlerUrl) {
            logger.error(`invalid crawling url: ${crawlerUrl}`);
            return;
        }

        try {
            if (this.type === 'plain') {
                crawlResult = await this.plainHttpRequest(crawlerUrl, this.targets);
            }
            else {
                // 默认走浏览器抓取模式
                let actions = [];
                if (Array.isArray(this.actions)) {
                    actions = this.actions;
                }

                if (this.engine === 'playwright') {
                    crawlResult = await this.playwrightRequest(this.browser, crawlerUrl, this.targets, actions);
                }
                else {
                    // 默认 engineType = 'puppeteer'
                    crawlResult = await this.puppeteerRequest(crawlerUrl, this.targets, actions);
                }

            }
        }
        catch (err) {
            crawlResult = {
                crawlError: err.toString()
            };
            logger.fatal(`some unknown error during crawling: ${err.toString()}`);
        }
        return crawlResult;
    }

    async plainHttpRequest(url, targets) {
        logger.info(`plain http request, url: ${url}`);
        let headersParam = {
            'User-Agent': this.userAgent
        };
        if (this.customHeaders) {
            Object.assign(headersParam, this.customHeaders);
        }
        let html = await http({
            headers: headersParam,
            url: url,
            retryLimit: 1
        });

        if (html === 'crawl failed') {
            logger.error(`plain http request failed, url: ${url}`);
            return 'crawl failed';
        }

        let isValid = await this.parseHtml(html);
        if (!isValid) {
            logger.error(`plain http request got invalid result, url: ${url}`);
            return 'invalid html';
        }

        logger.debug(`plain http request has finished, url: ${url}`);
        let vdom = new JsDom(html, { virtualConsole });
        let document = vdom.window.document;
        let extractFromHtml = util.extractFromHtml.bind({document});
        let output = extractFromHtml(targets);
        return output;
    }

    get browserViewport() {
        if (this.deviceWidth && this.deviceHeight) {
            return {
                width: this.deviceWidth,
                height: this.deviceHeight
            };
        }

        if (this.deviceType === 'mobile') {
            return {
                width: 320,
                height: 568,
                isMobile: true
            };
        }
        else if (this.deviceType === 'pc') {
            return {
                width: 1440,
                height: 960
            };
        }
        else {
            return {
                width: 1000,
                height: 1000
            };
        }
    }

    async puppeteerRequest(url, targets, actions) {
        logger.info(`headless browser request, url: ${url}`);

        let headersParam = {
            'User-Agent': this.userAgent
        };
        if (this.customHeaders) {
            Object.assign(headersParam, this.customHeaders);
        }
        let output = await puppeteer.request({
            url: url,
            headers: headersParam,
            viewPort: this.browserViewport,
            actions: actions,
            targets: targets,
            retryLimit: 1,
            intruderMap: this.intruderMap,
        });

        if (output === 'crawl failed') {
            logger.error(`headless browser request failed, url: ${url}`);
            return 'crawl failed';
        }

        let isValid = await this.parseHtml(output.html);
        if (!isValid) {
            logger.error(`plain http request got invalid result, url: ${url}`);
            return 'invalid html';
        }

        return output.result;
    }

    async playwrightRequest(browserType, url, targets, actions) {
        logger.info(`headless browser request, url: ${url}`);

        let headersParam = {
            'User-Agent': this.userAgent
        };
        if (this.customHeaders) {
            Object.assign(headersParam, this.customHeaders);
        }
        let output = await playwright.request({
            type: browserType,
            url: url,
            headers: headersParam,
            viewPort: this.browserViewport,
            actions: actions,
            targets: targets,
            retryLimit: 1,
            intruderMap: this.intruderMap,
        });

        if (output === 'crawl failed') {
            logger.error(`headless browser request failed, url: ${url}`);
            return 'crawl failed';
        }

        let isValid = await this.parseHtml(output.html);
        if (!isValid) {
            logger.error(`plain http request got invalid result, url: ${url}`);
            return 'invalid html';
        }

        return output.result;
    }
}

module.exports = Spider;