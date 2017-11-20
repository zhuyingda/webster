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

const redis = require('redis');
const logger = require('log4js').getLogger('webster');
const tableNamePrefix = 'webster:';
let clientInst = null;

module.exports.connect = function (option) {
    clientInst = redis.createClient({
        host: option.host,
        port: option.port,
        password: option.password
    });
    process.on('exit', function (){
        logger.trace('redis connect close');
        clientInst.quit();
    });
};

module.exports.quit = function () {
    logger.trace('redis connect close');
    clientInst.quit();
};

module.exports.lpop = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        clientInst.lpop(table, function (err, rel) {
            if (err === null) {
                logger.trace(`redis lpop: ${rel}`);
                try {
                    let output = JSON.parse(rel);
                    resolve(output);
                }
                catch (err) {
                    logger.error(`redis lpop json parse error: ${err}`);
                }
            }
            else {
                logger.fatal(`redis lpop with option ${option.toString()} error: ${err}`);
            }
        });
    });
};

module.exports.llen = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        clientInst.llen(table, function (err, rel) {
            if (err === null) {
                logger.trace(`redis llen: ${rel}`);
                resolve(rel);
            }
            else {
                logger.fatal(`redis llen with option ${option.toString()} error: ${err}`);
            }
        });
    });
};

module.exports.rpush = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        let input = JSON.stringify(option.value);
        clientInst.rpush(table, input, function (err, rel) {
            if (err === null) {
                logger.trace(`redis rpush successed`);
                resolve(rel);
            }
            else {
                logger.fatal(`redis rpush with option ${option.toString()} error: ${err}`);
            }
        });
    });
};

module.exports.hget = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        clientInst.hget(table, option.key, function (err, rel) {
            if (err === null) {
                logger.trace(`redis hget: ${rel}`);
                try {
                    let output = JSON.parse(rel);
                    resolve(output);
                } catch (err) {
                    logger.error(`redis hget json parse error: ${err}`);
                }
            }
            else {
                logger.fatal(`redis hget with option ${option.toString()} error: ${err}`);
            }
        });
    });
};

module.exports.hset = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        let input = JSON.stringify(option.value);
        clientInst.hset(table, option.key, input, function (err, rel) {
            if (err === null) {
                logger.trace(`redis hset successed`);
                resolve(rel);
            }
            else {
                logger.fatal(`redis hset with option ${option.toString()} error: ${err}`);
            }
        });
    });
};

module.exports.hdel = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        clientInst.hdel(table, option.key, function (err, rel) {
            if (err === null) {
                logger.trace(`redis hdel successed`);
                resolve(rel);
            }
            else {
                logger.fatal(`redis del with option ${option.toString()} error: ${err}`);
            }
        });
    });
};