const assert = require('assert');
const proxyquire = require('proxyquire');

const consumerChannel = 'test_channel_1';
const mockRedisList = {
    [`queue:${consumerChannel}`]: [
        {
            id: '5c2db355-57e0-4b09-ab24-cfaa3777eb8c',
            spiderType: 'browser',
            engineType: 'playwright',
            browserType: 'chromium',
            createTime: 1725268548850,
            url: 'http://127.0.0.1:8181/?num=1',
            targets: [ { selector: '.container ul li', type: 'text', field: 'name' } ],
            actions: [ { type: 'waitAfterPageLoading', value: 500 } ]
        },
    ]
};
const mockRedisHash = {};
const REDIS_CONF = {
    host: 'test.redis.webster.com',
    port: 6379,
    password: 'testpwd123'
};

function MockSpider(inputParam) {
    console.log('debugzyd', inputParam);
}
MockSpider.prototype.startRequest = function () {};

const stub = {
    './spider': MockSpider,
    './redis': {
        rpush: function (option) {
            if (!mockRedisList[option.tableName]) {
                mockRedisList[option.tableName] = [];
            }
            mockRedisList[option.tableName].push(deepCopy(option.value));
            return new Promise((resolve) => {
                resolve(1);
            });
        },
        lpop: function (option) {
            if (!mockRedisList[option.tableName]) {
                throw new Error('stub-redis: error, invalid lpop tableName');
            }
            return new Promise((resolve) => {
                resolve(mockRedisList[option.tableName].shift());
            });
        },
        hset: function (option) {
            if (!mockRedisHash[option.tableName]) {
                mockRedisHash[option.tableName] = [];
            }
            mockRedisHash[option.tableName][option.key] = deepCopy(option.value);
            return new Promise((resolve) => {
                resolve(1);
            });
        },
        hget: function (option) {
            if (!mockRedisHash[option.tableName]) {
                throw new Error('stub-redis: error, invalid hget tableName');
            }
            if (!mockRedisHash[option.tableName][option.key]) {
                throw new Error('stub-redis: error, invalid hget key');
            }
            return new Promise((resolve) => {
                resolve(JSON.stringify(mockRedisHash[option.tableName][option.key]));
            });
        },
        hgetall: function () {
            return new Promise((resolve) => {
                resolve([]);
            });
        },
        connect: function () {
            return;
        }
    }
};
const Consumer = proxyquire('../../lib/consumer', stub);

describe('unit test: Consumer', function() {
    it.only('', function (done) {
        class TestConsumer extends Consumer {
            constructor(option) {
                super(option);
            }
            afterCrawlRequest(result) {
                console.log('debug111', result);
                done();
            }
        }
        let myConsumer = new TestConsumer({
            channel: consumerChannel,
            sleepTime: 5000,
            deviceType: 'pc',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
            customHeaders: {
                'Referer': 'https://www.domain.com/'
            },
            dbConf: {
                redis: REDIS_CONF
            }
        });
        try {
            myConsumer.startConsume();
        }
        catch (err) {
            console.log('browser mode consumer executing got error');
            done();
        }
    });
});