# Webster
[![npm version](https://badge.fury.io/js/webster.svg)](https://www.npmjs.com/package/webster)

## Overview
Webster is a reliable web crawling and scraping framework written with Node.js, used to crawl websites and extract structured data from their pages. Which is different from other crawling framework is that Webster can scrape the content which rendered by browser client side javascript and ajax request.

------
Which you need to know is that webster is still under development, so some api or method name may change in the future, but the main ideas will not change.

- If you are intrested about this project;
- If you want to develop some web crawler program and you prefer javascript than python;
- Or you just want to have a crawling framework which can scrape asynchronism content in a web page;

**Please star and watch this repository, I am sure that you will not be disappointed at webster**.
------

## Requirements
- Node.js 8.x+, redis
- Works on Linux, Mac OSX

## Install
```bash
npm install webster
```

## Documentation
Webster focuses on conurrency, so it is designed by producer-consumer pattern.

![workflow](https://www.zhuyingda.com/static/img/webster-workflow.svg)

A producer produce tasks and push them to a channel of task queue.

Meanwhile, one or a lot of consumers are waiting for pop task from the channel which they are watching.

After get task, consumers are responsible for crawling.

When the crawling request return, you will got a **callback function** and you can choose writing db or produce new tasks (as a producer) and push them to task queue.

Let's have a try:

------
Producer side:

```javascript
const Webster = require('webster');
const Producer = Webster.producer;
const Task = Webster.task;
let tasks = [];

tasks.push(new Task({
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

This is a producer demo, as you can see, create some tasks by **Task** class just like this, then create a **Producer** instance and invoke `sendTasksToQueue` method to send your tasks to your queue.

Notice that you should have a redis server for your **webster queue**.

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

This is a consumer demo. You must build a subclass inherit the **Consumer** parent class.

In your subclass you can implement your logic after crwal request by override the parent class method `afterCrawlRequest`. You may write them to db or create another **Producer** to do more things about crawling.

When the channel of the task queue which you are watching is empty, the consumer instance will sleep for 5 second, which you can set by `sleepTime`.

The `deviceType` means that you want to crawl the page by a pc browser or a mobile phone browser, of course these are all fake by our crawler framework. You can set `deviceType` to `pc` or `mobile`.