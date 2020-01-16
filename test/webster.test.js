const assert = require('assert');
const mockServer = require('./mock/server');
const REDIS_CONF = {
    host: 'redis-13437.c10.us-east-1-2.ec2.cloud.redislabs.com',
    port: 13437,
    password: '0pFnuxvbjHurcR1WBFzsL4YI39s925f2'
};
const MOCK_SERVER_PORT = 8081;
const TEST_CHANNEL_1 = '_tc1_' + (Math.random() * 1000000).toFixed();
const TEST_CHANNEL_2 = '_tc2_' + (Math.random() * 1000000).toFixed();
let doneTest = 0;

function ifExit() {
    doneTest++;
    if (doneTest === 4) {
        console.log('webster: all test case has finished.')
        setTimeout(() => {
            process.exit(0);
        }, 500);
    }
}

describe('webster unit test', function() {
    before(function () {
        mockServer.listen(MOCK_SERVER_PORT);
    });
    after(function () {
        mockServer.close(MOCK_SERVER_PORT);
    });
    describe('task module test', function() {
        const Task = require('../lib/task');
        let task1 = new Task({
            spiderType: 'plain',
            url: 'https://www.baidu.com/s?wd=javascript',
            targets: [
                {
                    selector: '.result.c-container h3',
                    type: 'text',
                    field: 'title'
                }
            ]
        }).dump();
        let task2 = new Task({
            spiderType: 'plain',
            url: 'https://www.baidu.com/s?wd=javascript',
            targets: [
                {
                    selector: '.result.c-container h3',
                    type: 'text',
                    field: 'title'
                }
            ]
        }).dump();

        it('should not two task id equal', function() {
            assert.notEqual(task1.id, task2.id);
        });

        it('should two task url equal', function () {
            assert.equal(task1.url, task2.url);
        });
    });

    describe('consumer & producer module test in browser mode', function() {
        this.timeout(60000);
        const setSelector = '.container ul li';
        it('test browser mode producer', function (done) {
            const Producer = require('../lib/producer');
            console.info(`test channel: ${TEST_CHANNEL_1}`);
            let myProducer = new Producer({
                channel: TEST_CHANNEL_1,
                dbConf: {
                    redis: REDIS_CONF
                }
            });
            const Task = require('../lib/task');
            let task = new Task({
                spiderType: 'browser',
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
                ifExit();
            });
        });

        it('test consumer for browser crawling', function (done) {
            const Consumer = require('../lib/consumer');
            class TestConsumer extends Consumer {
                constructor(option) {
                    super(option);
                }
                afterCrawlRequest(result) {
                    if (result && result.name) {
                        assert.equal(17, result.name.length);

                        assert.equal(setSelector, result.name[0].selector);
                        assert.equal('Kodiak', result.name[0].text);
                        assert.equal(0, result.name[0].index);

                        assert.equal(setSelector, result.name[1].selector);
                        assert.equal('Cheetah', result.name[1].text);
                        assert.equal(1, result.name[1].index);

                        assert.equal(setSelector, result.name[2].selector);
                        assert.equal('Puma', result.name[2].text);
                        assert.equal(2, result.name[2].index);
                        done();
                    }
                    else {
                        console.error('test consumer for browser crawling unit error');
                        done(new Error());
                    }
                    ifExit();
                }
            }
            let myConsumer = new TestConsumer({
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
                console.log('browser mode consumer executing got error');
                done();
                ifExit();
            }
        });
    });

    describe('consumer & producer module test in plain mode', function() {
        this.timeout(20000);
        const setSelector = '.container ul li';
        it('test plain mode producer', function (done) {
            console.info(`test channel: ${TEST_CHANNEL_2}`);
            const Producer = require('../lib/producer');
            let myProducer = new Producer({
                channel: TEST_CHANNEL_2,
                dbConf: {
                    redis: REDIS_CONF
                }
            });
            const Task = require('../lib/task');
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
                ifExit();
            });
        });
        it('test consumer for plain crawling', function (done) {
            const Consumer = require('../lib/consumer');
            class TestConsumer2 extends Consumer {
                constructor(option) {
                    super(option);
                }
                afterCrawlRequest(result) {
                    done();
                    ifExit();
                }
            }
            let myConsumer = new TestConsumer2({
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
                console.log('plain mode consumer executing got error');
                done();
                ifExit();
            }
        });
    });
});