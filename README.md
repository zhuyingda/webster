# Webster
[![npm version](https://badge.fury.io/js/webster.svg)](https://www.npmjs.com/package/webster)
[![Build Status](https://travis-ci.org/zhuyingda/webster.svg?branch=master)](https://travis-ci.org/zhuyingda/webster)
[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu)

## Overview
Webster is a reliable web crawling and scraping framework written with Node.js, used to crawl websites and extract structured data from their pages. Which is different from other crawling framework is that Webster can scrape the content which rendered by browser client side javascript and ajax request.

## Docker quick start
pull the example docker image:
```bash
docker pull zhuyingda/webster-demo
docker run -it zhuyingda/webster-demo
```

here is a simple demo for crawler about Baidu search result web page:
```bash
node demo_producer.js && node demo_consumer.js
```

## Requirements
- Node.js 8.x+, redis
- Works on Linux, Mac OSX

Or you can deploy on [Docker](https://hub.docker.com/r/zhuyingda/webster-runtime/).

## Install
```bash
npm install webster
```

## Documentation
You can see more details from [here](http://webster.zhuyingda.com/).

## License

[GPL-V3](http://www.gnu.org/licenses/)

Copyright (c) 2017-present, Yingda (Sugar) Zhu
