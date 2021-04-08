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
const DEFAULT_USER_AGENT = 'webster crawler (https://github.com/zhuyingda/webster)';

class Spider {
    constructor(option) {
        this.type = option.type;
        if (this.type === 'browser') {
            this.engine = option.engine || 'puppeteer';

            if (this.engine === 'playwright') {
                this.browser = option.browser || 'chromium';
            }

        }
        this.userAgent = option.userAgent || DEFAULT_USER_AGENT;
        this.url = option.url;
        this.targets = option.targets || [];
        if (Array.isArray(option.actions)) {
            this.actions = option.actions;
        }
        this.deviceType = option.deviceType || 'pc';
        if (option.customHeaders && Object.keys(option.customHeaders).length > 0) {
            this.customHeaders = option.customHeaders;
        }
    }

    async isValidHtml(html) {
        return true;
    }

    async startRequest() {
        let crawlResult = {};
        try {
            if (this.type === 'plain') {
                crawlResult = await this.plainHttpRequest(this.url, this.targets);
            }
            else if (this.type === 'browser') {
                let actions = [];
                if (Array.isArray(this.actions)) {
                    actions = this.actions;
                }

                if (this.engine === 'playwright') {
                    crawlResult = await this.playwrightRequest(this.browser, this.url, this.targets, actions);
                }
                else {
                    // 默认 engineType = 'puppeteer'
                    crawlResult = await this.puppeteerRequest(this.url, this.targets, actions);
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
        logger.debug(`plain http request, url: ${url}`);
        let headersParam= {
            'User-Agent': this.userAgent
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

        let isValid = await this.isValidHtml(html);
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
    async puppeteerRequest(url, targets, actions) {
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

        let headersParam = {
            'User-Agent': this.userAgent
        };
        if (this.customHeaders) {
            Object.assign(headersParam, this.customHeaders);
        }
        let output = await puppeteer.request({
            url: url,
            headers: headersParam,
            viewPort: viewPortSet,
            actions: actions,
            targets: targets
        });

        if (output === 'crawl failed') {
            logger.error(`headless browser request failed, url: ${url}`);
            return 'crawl failed';
        }

        return output.result;
    }
    async playwrightRequest(browserType, url, targets, actions) {
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
            viewPort: viewPortSet,
            actions: actions,
            targets: targets
        });

        if (output === 'crawl failed') {
            logger.error(`headless browser request failed, url: ${url}`);
            return 'crawl failed';
        }

        return output.result;
    }
}

module.exports = Spider;