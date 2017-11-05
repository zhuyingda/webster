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

module.exports.request = async function (option) {
    if (!browserInst) {
        logger.trace('headless chromium will launch');
        browserInst = await puppeteer.launch({
            args: [
                '--no-sandbox', '--disable-setuid-sandbox'
            ],
            // headless: false,
            ignoreHTTPSErrors: true
        });
        logger.info('headless chromium launch');
    }
    let page = await browserInst.newPage();
    logger.trace(`browser create new page for url: ${option.url}`);
    await page.setViewport(option.viewPort);
    await page.setUserAgent(option.userAgent);
    logger.trace(`browser will request for url: ${option.url}`);
    await page.goto(option.url, {waitUntil: 'networkidle'});
    logger.trace(`browser request finish for url: ${option.url}`);
    let html = await page.content();
    logger.trace(`browser get page content: ${option.url}`);
    page.close();
    logger.trace(`browser page close`)
    return html;
};

module.exports.close = function () {
    if (browserInst) {
        browserInst.close();
    }
};