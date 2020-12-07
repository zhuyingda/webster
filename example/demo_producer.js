const Webster = require('webster');
const Producer = Webster.producer;
const Task = Webster.task;

let task = new Task({
    spiderType: 'browser',
    engineType: 'playwright',
    browserType: 'chromium',
    url: 'http://quotes.toscrape.com/tag/humor/',
    targets: [
        {
            selector: 'span.text',
            type: 'text',
            field: 'quote'
        },
        {
            selector: 'li.next > a',
            type: 'attr',
            attrName: 'href',
            field: 'link'
        }
    ],
    actions: [
        {
            type: 'waitAfterPageLoading',
            value: 500
        }
    ],
    referInfo: {
        para1: 'this is a refer field 1',
        para2: 'this is a refer field 2'
    }
});

let myProducer = new Producer({
    channel: 'demo_channel1',
    dbConf: {
        redis: {
            host: 'redis-12419.c44.us-east-1-2.ec2.cloud.redislabs.com',
            port: 12419,
            password: 'X2AcjziaOOYPppWFOPiP4rmzZ9RFLViv'
        }
    }
});
myProducer.generateTask(task).then(() => {
    console.log('done');
    process.exit();
});