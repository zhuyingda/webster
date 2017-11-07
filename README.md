# Webster

## Overview
Webster is a reliable web crawling and scraping framework written with Node.js, used to crawl websites and extract structured data from their pages. Which is different from other crawling framework is that Webster can scrape the content which rendered by browser client side javascript and ajax request.

## Requirements
- Node.js 8.x+, redis
- Works on Linux, Mac OSX

## Install
```bash
npm install webster
```

## Documentation
Webster focuses on conurrency, so it is designed by producer-consumer pattern.

------
Producer side:

```javascript
const Webster = require('webster');
const Producer = Webster.producer;
const Task = Webster.task;
let tasks = [];

tasks.push(new Task({
    channel: 'baidu',
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
    ]
}));

tasks.push(new Task({
    channel: 'baidu',
    spiderType: 'plain',
    url: 'https://www.baidu.com/s?wd=javascript',
    targets: [
        {
            selector: '.result.c-container h3',
            type: 'text',
            field: 'title'
        }
    ]
}));

let myProducer = new Producer({
    channel: 'baidu',
    dbConf: {
        redis: {
            host: '<your redis host>',
            port: 8888,
            password: '<your redis password>'
        }
    }
});
myProducer.sendTasksToQueue(tasks).then(() => {
    console.log('done');
});
````
------
Consumer side:

```javascript
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
            host: '<your redis host>',
            port: 8888,
            password: '<your redis password>'
        }
    }
});
myConsumer.setup();
```