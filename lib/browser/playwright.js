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

const playwright = require('playwright');
const logger = require('log4js').getLogger('webster');
const util = require('../util');
let browserInst = null;
let retryLimit = 10;

const launchConfig = {
    'chromium': {
        args: [
            '--no-sandbox', '--disable-setuid-sandbox'
        ],
        headless: process.env.MOD === 'browser'? false: true,
        ignoreHTTPSErrors: true
    },
    'firefox': {
        headless: process.env.MOD === 'browser'? false: true,
        ignoreHTTPSErrors: true
    },
    'webkit': {
        headless: process.env.MOD === 'browser'? false: true,
        ignoreHTTPSErrors: true
    }
};

module.exports.request = async function (option) {
    if (!browserInst) {
        logger.trace(`[playwright] headless ${option.type} will launch`);
        browserInst = await playwright[option.type].launch(launchConfig[option.type]);
        logger.info(`[playwright] headless ${option.type} launch`);
        process.on('exit', function (){
            if (browserInst) {
                browserInst.close();
            }
        });
    }

    let page = await browserInst.newPage();
    logger.info(`[playwright] browser create new page for url: ${option.url}`);
    await page.setViewportSize(option.viewPort);
    await page.setExtraHTTPHeaders(option.headers);

    if (!!option.retryLimit) {
        retryLimit = option.retryLimit;
    }
    let requestSuccess = false;
    let retry = 0;

    do {
        if (retry > retryLimit) {
            logger.error(`[playwright] browser retry out of limit, url: ${option.url}`);
            page.close();
            return 'crawl failed';
        }

        if (retry !== 0 && retry <= retryLimit) {
            logger.debug(`[playwright] browser request retry: ${retry}`);
        }
        try {
            logger.trace(`[playwright] browser will request for url: ${option.url}`);
            await page.goto(option.url, {waitUntil: 'networkidle'});
            if (!!option.actions && Array.isArray(option.actions)) {
                for (let action of option.actions) {
                    switch (action.type) {
                        case 'waitAfterPageLoading':
                            if (Number.isInteger(action.value)) {
                                logger.info(`[playwright] browser action [waitAfterPageLoading]: time: ${action.value}`);
                                await util.waitFor(action.value);
                            }
                            break;
                        case 'clickSelectorElement':
                            if (typeof action.selector === 'string') {
                                logger.info(`[playwright] browser action [clickSelectorElement], dom: ${action.selector}`);
                                await page.evaluate((selectorStr) => {
                                    let elements = document.querySelectorAll(selectorStr);
                                    for (let element of elements)
                                        element.click();
                                }, action.selector);
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
            logger.trace(`[playwright] browser request finish for url: ${option.url}`);
            requestSuccess = true;
        } catch (err) {
            requestSuccess = false;
            retry++;
            logger.fatal(`[playwright] browser request to url ${option.url} has error: ${err.toString()}`);
        }
    }
    while(!requestSuccess);

    logger.debug(`[playwright] browser extract targets: ${option.targets}`);
    let result = await page.evaluate(util.extractFromHtml, option.targets);
    let html = await page.content();
    logger.trace(`[playwright] browser get page content: ${option.url}, html: ${html}`);
    page.close();
    logger.debug(`[playwright] browser page close`)
    return {
        result,
        html
    };
};

