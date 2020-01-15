# Webster
[![Financial Contributors on Open Collective](https://opencollective.com/webster/all/badge.svg?label=financial+contributors)](https://opencollective.com/webster) [![npm version](https://badge.fury.io/js/webster.svg)](https://www.npmjs.com/package/webster)
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

## Architecture overview

![](https://www.zhuyingda.com/static/img/webster-workflow.svg)

## Documentation
You can see more details from [here](http://webster.zhuyingda.com/).

## Contributors

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
