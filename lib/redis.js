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
const assert = require('assert');
const tableNamePrefix = 'webster:';
let clientInst = null;

module.exports.connect = function (option) {
    clientInst = redis.createClient({
        host: option.host,
        port: option.port,
        password: option.password
    });
};

module.exports.quit = function () {
    clientInst.quit();
};

module.exports.lpop = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        clientInst.lpop(table, function (err, rel) {
            assert.equal(null, err);
            let output = JSON.parse(rel);
            resolve(output);
        });
    });
};

module.exports.llen = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        clientInst.llen(table, function (err, rel) {
            assert.equal(null, err);
            resolve(rel);
        });
    });
};

module.exports.rpush = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        let input = JSON.stringify(option.value);
        clientInst.rpush(table, input, function (err, rel) {
            assert.equal(null, err);
            resolve(rel);
        });
    });
};

module.exports.hget = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        clientInst.hget(table, option.key, function (err, rel) {
            assert.equal(null, err);
            let output = JSON.parse(rel);
            resolve(output);
        });
    });
};

module.exports.hset = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        let input = JSON.stringify(option.value);
        clientInst.hset(table, option.key, input, function (err, rel) {
            assert.equal(null, err);
            resolve(rel);
        });
    });
};

module.exports.hdel = function (option) {
    return new Promise((resolve, reject) => {
        let table = tableNamePrefix + option.tableName;
        clientInst.hdel(table, option.key, function (err, rel) {
            assert.equal(null, err);
            resolve(rel);
        });
    });
};