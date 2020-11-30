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

const uuidv4 = require('uuid/v4');

class Task {
    constructor(option) {
        this.id = uuidv4();
        this.spiderType = option.spiderType || 'plain'; // plain or browser
        this.engineType = option.engineType || 'puppeteer';
        if (this.engineType === 'playwright') {
            this.browserType = option.browserType || 'chromium';
        }
        this.createTime = new Date().getTime();
        this.url = option.url;
        this.targets = option.targets;
        if (!!option.referInfo) {
            this.referInfo = option.referInfo;
        }
        if (this.spiderType === 'browser') {
            if (!!option.actions && Array.isArray(option.actions)) {
                this.actions = option.actions;
            }
            else {
                this.actions = [];
            }
        }
    }
    dump() {
        let ret = {
            id: this.id,
            spiderType: this.spiderType,
            createTime: this.createTime,
            url: this.url,
            targets: this.targets,
            actions: this.actions
        };
        if (!!this.referInfo) {
            ret.referInfo = this.referInfo;
        }
        return ret;
    }
}

module.exports = Task;