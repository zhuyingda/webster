const Webster = require('webster');
const Producer = Webster.producer;
const Task = Webster.task;

let task = new Task({
    spiderType: 'browser',
    url: 'https://www.baidu.com/s?wd=javascript',
    targets: [
        {
            selector: '.result.c-container h3',
            type: 'text',
            field: 'title'
        }
    ]
});

let myProducer = new Producer({
    channel: 'baidu',
    dbConf: {
        redis: {
            host: 'redis-15455.c80.us-east-1-2.ec2.cloud.redislabs.com',
            port: 15455,
            password: 'L7hfNRGniDYdSZxJpCmdDtafqEsDxpaN'
        }
    }
});
myProducer.generateTask(task).then(() => {
    console.log('done');
    process.exit();
});