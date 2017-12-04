# Webster
[![npm version](https://badge.fury.io/js/webster.svg)](https://www.npmjs.com/package/webster)
[![Build Status](https://travis-ci.org/zhuyingda/webster.svg?branch=master)](https://travis-ci.org/zhuyingda/webster)

## Overview
Webster is a reliable web crawling and scraping framework written with Node.js, used to crawl websites and extract structured data from their pages. Which is different from other crawling framework is that Webster can scrape the content which rendered by browser client side javascript and ajax request.

------
Which you need to know is that webster is still under development, so some api or method name may change in the future, but the main ideas will not change.

- If you are intrested about this project;
- If you want to develop some web crawler program and you prefer javascript than python;
- Or you just want to have a crawling framework which can scrape asynchronism content in a web page;
- Please star and watch this repository, I am sure that you will not be disappointed at webster.
------

## Docker quick start
pull the example docker image:
```bash
docker pull zhuyingda/webster-demo
docker run -it zhuyingda/webster-demo
```

in the docker runtime cli:
```bash
cd /root/webster_runtime/
node demo_producer.js
node demo_consumer.js
```

## Requirements
- Node.js 8.x+, redis
- Works on Linux, Mac OSX

## Install
```bash
npm install webster
```

## Documentation
You can see more details from [here](http://webster.zhuyingda.com/).

## License

[GPL-V3](http://www.gnu.org/licenses/)

Copyright (c) 2017-present, Yingda (Sugar) Zhu