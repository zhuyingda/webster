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
    channel: 'demo_channel1',
    sleepTime: 5000,
    deviceType: 'pc',
    dbConf: {
        redis: {
            host: 'redis-12419.c44.us-east-1-2.ec2.cloud.redislabs.com',
            port: 12419,
            password: 'X2AcjziaOOYPppWFOPiP4rmzZ9RFLViv'
        }
    }
});
myConsumer.startConsume();