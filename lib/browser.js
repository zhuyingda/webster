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
let browserInst = null;

module.exports.request = async function (option) {
    if (!browserInst) {
        browserInst = await puppeteer.launch({
            args: [
                '--no-sandbox', '--disable-setuid-sandbox'
            ],
            // headless: false,
            ignoreHTTPSErrors: true
        });
    }
    let page = await browserInst.newPage();
    await page.setViewport(option.viewPort);
    await page.setUserAgent(option.userAgent);
    await page.goto(option.url, {waitUntil: 'networkidle'});
    let html = await page.content();
    page.close()
    return html;
};

module.exports.close = function () {
    if (browserInst) {
        browserInst.close();
    }
};