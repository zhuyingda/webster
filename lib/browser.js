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

const puppeteer = require('puppeteer');
const logger = require('log4js').getLogger('webster');
let browserInst = null;
let retryLimit = 10;

module.exports.request = async function (option) {
    if (!browserInst) {
        logger.trace('headless chromium will launch');
        browserInst = await puppeteer.launch({
            args: [
                '--no-sandbox', '--disable-setuid-sandbox'
            ],
            headless: process.env.MOD === 'browser'? false: true,
            ignoreHTTPSErrors: true
        });
        logger.info('headless chromium launch');
        process.on('exit', function (){
            if (browserInst) {
                browserInst.close();
            }
        });
    }

    let page = await browserInst.newPage();
    logger.info(`browser create new page for url: ${option.url}`);
    await page.setViewport(option.viewPort);
    await page.setExtraHTTPHeaders(option.headers);
    // await page.setUserAgent(option.userAgent);

    if (!!option.retryLimit) {
        retryLimit = option.retryLimit;
    }
    let requestSuccess = false;
    let retry = 0;
    do {
        if (retry > retryLimit) {
            logger.error(`browser retry out of limit, url: ${option.url}`);
            page.close();
            return 'crawl failed';
        }

        if (retry !== 0 && retry <= retryLimit) {
            logger.debug(`browser request retry: ${retry}`);
        }
        try {
            logger.trace(`browser will request for url: ${option.url}`);
            await page.goto(option.url, {waitUntil: 'networkidle'});
            logger.trace(`browser request finish for url: ${option.url}`);
            requestSuccess = true;
        } catch (err) {
            requestSuccess = false;
            retry++;
            logger.fatal(`browser request to url ${option.url} has error: ${err.toString()}`);
        }
    }
    while(!requestSuccess);

    let html = await page.content();
    logger.trace(`browser get page content: ${option.url}`);
    page.close();
    logger.trace(`browser page close`)
    return html;
};