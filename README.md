# Webster
[![Financial Contributors on Open Collective](https://opencollective.com/webster/all/badge.svg?label=financial+contributors)](https://opencollective.com/webster) [![npm version](https://badge.fury.io/js/webster.svg)](https://www.npmjs.com/package/webster)
[![Build Status](https://travis-ci.org/zhuyingda/webster.svg?branch=master)](https://travis-ci.org/zhuyingda/webster)

## Overview

Webster is a reliable web crawling and scraping framework written with Node.js, used to crawl websites and extract structured data from their pages.

Which is different from other crawling framework is that Webster can scrape the content which rendered by browser client side javascript and ajax request

## Requirements
- Node.js 10.x+
- Works on Linux, Mac OSX

Or you can deploy on [Docker](https://hub.docker.com/r/zhuyingda/webster-runtime/).

## Install
```bash
npm install webster
```

## Single spider example

```javascript
const { spider } = require('webster');

class MySpider extends spider {
    get defUserAgent() {
        return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36';
    }
    get defDeviceType() {
        return 'pc';
    }
    async parseHtml(html) {
        return true;
    }
}

(async () => {
    const spider = new MySpider({
        actions: [
            {
                type: 'waitForSelector',
                selector: 'div.js-details-container',
            }
        ],
        targets: [
            {
                selector: 'div.Box-row[role=row]',
                type: 'text',
                field: 'sugs'
            }
        ],
    });
    const url = `https://github.com/zhuyingda/webster`;
    let crawlResult = await spider.startRequest(url);
    console.log(crawlResult);
})();
```

## Docker cluster example

Pull the example docker image:
```bash
docker pull zhuyingda/webster-demo
docker run -it zhuyingda/webster-demo
```

In this docker image, there is a simple cluster-able example:

```javascript
// producer
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
```

```javascript
// consumer
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
```

```bash
node demo_producer.js
env MOD=debug node demo_consumer.js
```

You can organize your crawler cluster by Consumer and Producer like this:
![](https://raw.githubusercontent.com/zhuyingda/webster/master/doc/webster-workflow.svg)

## Usage on Raspbian Platform
```bash
sudo apt install chromium-browser chromium-codecs-ffmpeg
env MOD=debug EXE_PATH=/usr/bin/chromium-browser node demo_consumer.js
```

## Documentation
You can see more details from [here](http://webster.zhuyingda.com/).

### Code Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].
<a href="https://github.com/zhuyingda/webster/graphs/contributors"><img src="https://opencollective.com/webster/contributors.svg?width=890&button=false" /></a>

### Financial Contributors

Become a financial contributor and help us sustain our community. [[Contribute](https://opencollective.com/webster/contribute)]

#### Individuals

<a href="https://opencollective.com/webster"><img src="https://opencollective.com/webster/individuals.svg?width=890"></a>

#### Organizations

Support this project with your organization. Your logo will show up here with a link to your website. [[Contribute](https://opencollective.com/webster/contribute)]

<a href="https://opencollective.com/webster/organization/0/website"><img src="https://opencollective.com/webster/organization/0/avatar.svg"></a>
<a href="https://opencollective.com/webster/organization/1/website"><img src="https://opencollective.com/webster/organization/1/avatar.svg"></a>
<a href="https://opencollective.com/webster/organization/2/website"><img src="https://opencollective.com/webster/organization/2/avatar.svg"></a>
<a href="https://opencollective.com/webster/organization/3/website"><img src="https://opencollective.com/webster/organization/3/avatar.svg"></a>
<a href="https://opencollective.com/webster/organization/4/website"><img src="https://opencollective.com/webster/organization/4/avatar.svg"></a>
<a href="https://opencollective.com/webster/organization/5/website"><img src="https://opencollective.com/webster/organization/5/avatar.svg"></a>
<a href="https://opencollective.com/webster/organization/6/website"><img src="https://opencollective.com/webster/organization/6/avatar.svg"></a>
<a href="https://opencollective.com/webster/organization/7/website"><img src="https://opencollective.com/webster/organization/7/avatar.svg"></a>
<a href="https://opencollective.com/webster/organization/8/website"><img src="https://opencollective.com/webster/organization/8/avatar.svg"></a>
<a href="https://opencollective.com/webster/organization/9/website"><img src="https://opencollective.com/webster/organization/9/avatar.svg"></a>

## License

[GPL-V3](http://www.gnu.org/licenses/)

Copyright (c) 2017-present, Yingda (Sugar) Zhu
