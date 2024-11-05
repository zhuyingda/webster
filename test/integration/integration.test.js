const assert = require('assert');
const proxyquire = require('proxyquire');
const redisStub = require('./redis_stub');
const mockServer = require('../mock/server');
const Consumer = proxyquire('../../lib/consumer', redisStub);
const Producer = proxyquire('../../lib/producer', redisStub);
const Task = require('../../lib/task');
const REDIS_CONF = {
    host: 'redis-12419.c44.us-east-1-2.ec2.cloud.redislabs.com',
    port: 12419,
    password: 'X2AcjziaOOYPppWFOPiP4rmzZ9RFLViv'
};
const MOCK_SERVER_PORT = 8181;
const TEST_CHANNEL_1 = '_tc1_' + (Math.random() * 1000000).toFixed();
const TEST_CHANNEL_2 = '_tc2_' + (Math.random() * 1000000).toFixed();
const TEST_CHANNEL_3 = '_tc3_' + (Math.random() * 1000000).toFixed();

describe('integration test', function() {
    before(function () {
        mockServer.listen(MOCK_SERVER_PORT);
    });
    after(function () {
        mockServer.close(MOCK_SERVER_PORT);
    });

    describe('consumer & producer module test in plain mode', function() {
        this.timeout(20000);
        const setSelector = '.container ul li';
        it('test plain mode producer', function (done) {
            console.info(`test channel: ${TEST_CHANNEL_1}`);
            let myProducer = new Producer({
                channel: TEST_CHANNEL_1,
                dbConf: {
                    redis: REDIS_CONF
                }
            });
            let task = new Task({
                spiderType: 'plain',
                url: `http://127.0.0.1:${MOCK_SERVER_PORT}/?num=1`,
                targets: [
                    {
                        selector: setSelector,
                        type: 'text',
                        field: 'name'
                    }
                ]
            })
            myProducer.generateTask(task).then(() => {
                done();
            });
        });
        it('test consumer for plain crawling', function (done) {
            class TestConsumer2 extends Consumer {
                constructor(option) {
                    super(option);
                }
                afterCrawlRequest(result) {
                    done();
                }
            }
            let myConsumer = new TestConsumer2({
                channel: TEST_CHANNEL_1,
                sleepTime: 5000,
                deviceType: 'pc',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
                customHeaders: {
                    'Referer': 'https://www.zhuyingda.com/'
                },
                dbConf: {
                    redis: REDIS_CONF
                }
            });
            try {
                myConsumer.startConsume();
            }
            catch (err) {
                console.log('plain mode consumer executing got error');
                done();
            }
        });
    });

    describe('consumer & producer module test in browser(puppeteer) mode', function() {
        this.timeout(60000);
        const setSelector = '.container ul li';
        it('test browser(puppeteer) mode producer', function (done) {
            console.info(`test channel: ${TEST_CHANNEL_2}`);
            let myProducer = new Producer({
                channel: TEST_CHANNEL_2,
                dbConf: {
                    redis: REDIS_CONF
                }
            });
            let task = new Task({
                spiderType: 'browser',
                engineType: 'puppeteer',
                url: `http://127.0.0.1:${MOCK_SERVER_PORT}/?num=1`,
                targets: [
                    {
                        selector: setSelector,
                        type: 'text',
                        field: 'name'
                    }
                ],
                actions: [
                    {
                        type: "waitAfterPageLoading",
                        value: 500
                    }
                ]
            })
            myProducer.generateTask(task).then(() => {
                done();
            });
        });

        it('test consumer for browser(puppeteer) crawling', function (done) {

            class TestConsumer extends Consumer {
                constructor(option) {
                    super(option);
                }
                afterCrawlRequest(result) {
                    if (result && result.name) {
                        assert.strictEqual(17, result.name.length);

                        assert.strictEqual(setSelector, result.name[0].selector);
                        assert.strictEqual('Kodiak', result.name[0].text);
                        assert.strictEqual(0, result.name[0].index);

                        assert.strictEqual(setSelector, result.name[1].selector);
                        assert.strictEqual('Cheetah', result.name[1].text);
                        assert.strictEqual(1, result.name[1].index);

                        assert.strictEqual(setSelector, result.name[2].selector);
                        assert.strictEqual('Puma', result.name[2].text);
                        assert.strictEqual(2, result.name[2].index);
                        done();
                    }
                    else {
                        console.error('test consumer for browser crawling unit error');
                        done(new Error());
                    }
                }
            }
            let myConsumer = new TestConsumer({
                channel: TEST_CHANNEL_2,
                sleepTime: 5000,
                deviceType: 'pc',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
                customHeaders: {
                    'Referer': 'https://www.zhuyingda.com/'
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

    describe('consumer & producer module test in browser(playwright) mode', function() {
        this.timeout(60000);
        const setSelector = '.container ul li';
        it('test browser(playwright) mode producer', function (done) {
            console.info(`test channel: ${TEST_CHANNEL_3}`);
            let myProducer = new Producer({
                channel: TEST_CHANNEL_3,
                dbConf: {
                    redis: REDIS_CONF
                }
            });
            let task = new Task({
                spiderType: 'browser',
                engineType: 'playwright',
                browserType: 'chromium',
                url: `http://127.0.0.1:${MOCK_SERVER_PORT}/?num=1`,
                targets: [
                    {
                        selector: setSelector,
                        type: 'text',
                        field: 'name'
                    }
                ],
                actions: [
                    {
                        type: "waitAfterPageLoading",
                        value: 500
                    }
                ]
            })
            myProducer.generateTask(task).then(() => {
                done();
            });
        });

        it('test consumer for browser(playwright) crawling', function (done) {

            class TestConsumer extends Consumer {
                constructor(option) {
                    super(option);
                }
                afterCrawlRequest(result) {
                    if (result && result.name) {
                        assert.strictEqual(17, result.name.length);

                        assert.strictEqual(setSelector, result.name[0].selector);
                        assert.strictEqual('Kodiak', result.name[0].text);
                        assert.strictEqual(0, result.name[0].index);

                        assert.strictEqual(setSelector, result.name[1].selector);
                        assert.strictEqual('Cheetah', result.name[1].text);
                        assert.strictEqual(1, result.name[1].index);

                        assert.strictEqual(setSelector, result.name[2].selector);
                        assert.strictEqual('Puma', result.name[2].text);
                        assert.strictEqual(2, result.name[2].index);
                        done();
                    }
                    else {
                        console.error('test consumer for browser crawling unit error');
                        done(new Error());
                    }
                }
            }
            let myConsumer = new TestConsumer({
                channel: TEST_CHANNEL_3,
                sleepTime: 5000,
                deviceType: 'pc',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
                customHeaders: {
                    'Referer': 'https://www.zhuyingda.com/'
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

});