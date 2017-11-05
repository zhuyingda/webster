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

const redis = require('./redis');
const logger = require('log4js').getLogger('webster');

class Producer {
    constructor(option) {
        this.channel = option.channel;
        this.db = null;
        this.sendCounter = 0;
        this.redisConf = option.dbConf.redis;
    }
    async sendTasksToQueue(tasks) {
        redis.connect({
            host: this.redisConf.host,
            port: this.redisConf.port,
            password: this.redisConf.password
        });
        for (let task of tasks) {
            await redis.rpush({
                tableName: 'queue:' + this.channel,
                value: task
            });
            logger.info(`task send to queue: ${++this.sendCounter} ${task.url}`)
        }
        redis.quit();
    }
}

module.exports = Producer;