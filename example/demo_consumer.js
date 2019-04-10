const Webster = require('webster');
const Consumer = Webster.consumer;

class MyConsumer extends Consumer {
    constructor(option) {
        super(option);
    }
    afterCrawlRequest(result) {
        console.log('your scrape result:', result);
    }
}

let myConsumer = new MyConsumer({
    channel: 'baidu',
    sleepTime: 5000,
    deviceType: 'pc',
    dbConf: {
        redis: {
            host: 'redis-15455.c80.us-east-1-2.ec2.cloud.redislabs.com',
            port: 15455,
            password: 'L7hfNRGniDYdSZxJpCmdDtafqEsDxpaN'
        }
    }
});
myConsumer.startConsume();