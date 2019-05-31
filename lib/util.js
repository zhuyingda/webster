/**
 * Copyright (c) 2019 5u9ar (zhuyingda)
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

function waitFor(ms) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(true);
        }, ms);
    });
}

module.exports.waitFor = waitFor;

function extractFromHtml(targets) {
    let output = {};
    let documentInst = this.document;
    for (let target of targets) {
        let doms = documentInst.querySelectorAll(target.selector);
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
        output[target.field] = targetResult;
    }
    return output;
}

module.exports.extractFromHtml = extractFromHtml;