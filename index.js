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

const log4js = require('log4js');
const path = require('path');

let configOption = {
    appenders: {
        webster: {}
    },
    categories: {
        default: {
            appenders: ['webster']
        }
    }
};
if (!!process.env.MOD) {
    configOption.appenders.webster = {
        type: 'stdout'
    };
    configOption.categories.default.level = process.env.MOD;
}
else {
    configOption.appenders.webster = {
        type: 'file',
        filename: path.resolve(process.env.HOME, '.webster/running.log')
    };
    configOption.categories.default.level = 'info';
}

log4js.configure(configOption);

module.exports = require('./lib/Webster');