const assert = require('assert');
let doneTest = 0;

function ifExit() {
    doneTest++;
    if (doneTest === 4) {
        console.log('webster: all test case has finished.')
        process.exit();
    }
}

describe('webster unit test', function() {
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
        this.timeout(100000);
        it('test browser mode producer', function (done) {
            const Producer = require('../lib/producer');
            let myProducer = new Producer({
                channel: 'test',
                dbConf: {
                    redis: {
                        host: 'redis-15455.c80.us-east-1-2.ec2.cloud.redislabs.com',
                        port: 15455,
                        password: 'L7hfNRGniDYdSZxJpCmdDtafqEsDxpaN'
                    }
                }
            });
            const Task = require('../lib/task');
            let task = new Task({
                spiderType: 'browser',
                url: 'https://www.zhuyingda.com/blog.html',
                targets: [
                    {
                        selector: '.blog-item a',
                        type: 'text',
                        field: 'title'
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
                    done();
                    ifExit();
                }
            }
            let myConsumer = new TestConsumer({
                channel: 'test',
                sleepTime: 5000,
                deviceType: 'pc',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
                customHeaders: {
                    'Referer': 'https://www.zhuyingda.com/'
                },
                dbConf: {
                    redis: {
                        host: 'redis-15455.c80.us-east-1-2.ec2.cloud.redislabs.com',
                        port: 15455,
                        password: 'L7hfNRGniDYdSZxJpCmdDtafqEsDxpaN'
                    }
                }
            });
            myConsumer.startConsume();
        });
    });

    describe('consumer & producer module test in plain mode', function() {
        this.timeout(20000);
        it('test plain mode producer', function (done) {
            const Producer = require('../lib/producer');
            let myProducer = new Producer({
                channel: 'test2',
                dbConf: {
                    redis: {
                        host: 'redis-15455.c80.us-east-1-2.ec2.cloud.redislabs.com',
                        port: 15455,
                        password: 'L7hfNRGniDYdSZxJpCmdDtafqEsDxpaN'
                    }
                }
            });
            const Task = require('../lib/task');
            let task = new Task({
                spiderType: 'plain',
                url: 'https://www.zhuyingda.com/blog.html',
                targets: [
                    {
                        selector: '.blog-item a',
                        type: 'text',
                        field: 'title'
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
                channel: 'test2',
                sleepTime: 5000,
                deviceType: 'pc',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
                customHeaders: {
                    'Referer': 'https://www.zhuyingda.com/'
                },
                dbConf: {
                    redis: {
                        host: 'redis-15455.c80.us-east-1-2.ec2.cloud.redislabs.com',
                        port: 15455,
                        password: 'L7hfNRGniDYdSZxJpCmdDtafqEsDxpaN'
                    }
                }
            });
            try {
                myConsumer.startConsume();
            }
            catch (err) {
                console.log('browser consumer executing got error');
                done();
                ifExit();
            }
        });
    });
});