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

const puppeteer = require('puppeteer');
const logger = require('log4js').getLogger('webster');
const util = require('../util');
let browserInst = null;
let retryLimit = 10;

module.exports.request = async function (option) {
    if (!browserInst) {
        logger.debug('[puppeteer] headless chromium will launch');
        const launchOptions = {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            // https://developer.chrome.com/articles/new-headless/
            headless: process.env.MOD === 'browser' ? false : 'new',
            ignoreHTTPSErrors: true
        };
        if (process.env.EXE_PATH) {
            launchOptions.executablePath = process.env.EXE_PATH;
        }
        browserInst = await puppeteer.launch(launchOptions);
        logger.info('[puppeteer] headless chromium launch');
        process.on('exit', () =>{
            if (browserInst) {
                browserInst.close();
            }
        });
    }

    let page = await browserInst.newPage();
    logger.info(`[puppeteer] browser create new page for url: ${option.url}`);

    await page.setViewport(option.viewPort);
    logger.trace(`[puppeteer] set viewPort ${JSON.stringify(option.viewPort)}`);

    await page.setExtraHTTPHeaders(option.headers);
    logger.trace(`[puppeteer] set http-headers ${JSON.stringify(option.headers)}`);

    const urlHandleMap = option.intruderMap || {};
    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = request.url();
        const headers = request.headers();
        logger.trace(`[puppeteer] intruder handle url: ${url}`);
        if (!urlHandleMap[url]) {
            logger.trace(`[puppeteer] intruder continue`);
            request.continue();
            return;
        }

        switch (urlHandleMap[url].payload) {
            case 'empty':
                logger.trace(`[puppeteer] intruder empty resp`);
                request.respond({
                    status: 200,
                    contentType: headers['content-type'] || 'application/javascript',
                    body: ''
                });
                break;
            default:
                throw new Error(`unknown intruder payload ${urlHandleMap[url].payload}`);
        }
    });

    if (option.retryLimit) {
        retryLimit = option.retryLimit;
    }
    let requestSuccess = false;
    let retry = 0;
    const result = {};

    do {
        if (retry > retryLimit) {
            logger.error(`[puppeteer] browser retry out of limit, url: ${option.url}`);
            page.close();
            return 'crawl failed';
        }

        if (retry !== 0 && retry <= retryLimit) {
            logger.debug(`[puppeteer] browser request retry: ${retry}`);
        }

        try {
            logger.debug(`[puppeteer] browser will request for url: ${option.url}`);
            await page.goto(option.url, {waitUntil: 'networkidle0'});
            logger.debug('[puppeteer] page loaded');
            if (!!option.actions && Array.isArray(option.actions)) {
                for (let action of option.actions) {
                    switch (action.type) {
                        case 'waitAfterPageLoading':
                            if (Number.isInteger(action.value)) {
                                logger.info(`[puppeteer] browser action [waitAfterPageLoading]: time: ${action.value}`);
                                await util.waitFor(action.value);
                            }
                            else {
                                logger.fatal(`[puppeteer] browser request to url ${option.url} has invalid waitAfterPageLoading value ${action.targets}`);
                            }
                            break;
                        case 'clickSelectorElement':
                            if (typeof action.selector === 'string') {
                                logger.info(`[puppeteer] browser action [clickSelectorElement], dom: ${action.selector}`);
                                await page.evaluate((selectorStr) => {
                                    let elements = document.querySelectorAll(selectorStr);
                                    for (let element of elements) {
                                        element.click();
                                    }
                                }, action.selector);
                            }
                            else {
                                logger.fatal(`[puppeteer] browser request to url ${option.url} has invalid clickSelectorElement selector ${action.targets}`);
                            }
                            break;
                        case 'crawlTarget':
                            if (typeof action.targets === 'object' && action.targets instanceof Array) {
                                logger.info('[puppeteer] browser action [crawlTarget]');
                                let targetResult = await page.evaluate(util.extractFromHtml, action.targets);
                                Object.assign(result, targetResult);
                            }
                            else {
                                logger.fatal(`[puppeteer] browser request to url ${option.url} has invalid crawlingTarget targets ${action.targets}`);
                            }
                            break;
                        case 'waitForSelector':
                            if (typeof action.selector === 'string') {
                                logger.info(`[puppeteer] browser action [waitForSelector] finish, dom: ${action.selector}`);
                                await page.waitForSelector(action.selector);
                            }
                            else {
                                logger.fatal(`[puppeteer] browser action [waitForSelector] failed, dom: ${action.selector}`);
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
            logger.debug(`[puppeteer] browser request finish for url: ${option.url}`);
            requestSuccess = true;
        }
        catch (err) {
            requestSuccess = false;
            retry++;
            logger.fatal(`[puppeteer] browser request to url ${option.url} has error: ${err.toString()}`);
        }
    }
    while (!requestSuccess);

    logger.debug(`[puppeteer] browser extract targets: ${option.targets}`);
    let targetResult = await page.evaluate(util.extractFromHtml, option.targets);
    Object.assign(result, targetResult);
    let html = await page.content();
    logger.trace(`[puppeteer] browser get page content: ${option.url}, html: ${html}`);
    page.close();
    logger.debug('[puppeteer] browser page close');
    return {
        result,
        html
    };
};
