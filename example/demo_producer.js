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
        },
        {
            selector: '.result.c-container h3 a',
            type: 'attr',
            attrName: 'href',
            field: 'link'
        },
        {
            selector: '.result.c-container .c-abstract',
            type: 'html',
            field: 'htmlfrag'
        }
    ],
    actions: [
        {
            type: 'waitAfterPageLoading',
            value: 3000
        },
        {
            type: 'clickSelectorElement',
            selector: '.cr-title-sub'
        }
    ],
    referInfo: {
        para1: 'para1',
        para2: 'para2'
    }
});

let myProducer = new Producer({
    channel: 'baidu',
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