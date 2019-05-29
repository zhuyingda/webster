const assert = require('assert');

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

    describe('task module consumer & producer', function() {
        this.timeout(55000);
        it('test producer', function (done) {
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
                ]
            })
            myProducer.generateTask(task).then(() => {
                done();
            });
        });
        it('test consumer for plain crawling', function (done) {
            const Consumer = require('../lib/consumer');
            class TestConsumer extends Consumer {
                constructor(option) {
                    super(option);
                }
                afterCrawlRequest(result) {
                    console.log(result);
                    done();
                    process.exit();
                }
            }
            let myConsumer = new TestConsumer({
                channel: 'test',
                sleepTime: 5000,
                deviceType: 'pc',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
                delayTime: 1000,
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
});