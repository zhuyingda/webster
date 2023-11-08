const { spider } = require('webster');

let _ua = '';

class MySpider extends spider {
    get defUserAgent() {
        return _ua;
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
        type: 'browser',
        engine: 'playwright',
        actions: [
            {
                type: 'waitAfterPageLoading',
                value: 200
            }
        ],
        targets: [
            {
                selector: 'html',
                type: 'html',
                field: 'result'
            }
        ],
    });
    const url = process.env.URL || `https://www.zhuyingda.com/note`;
    const cookie = process.env.Cookie || ``;
    _ua = process.env.UA || `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36`;
    console.log('crawl input:', url, cookie, _ua);
    let crawlResult = await spider.startRequest(url);
    if (crawlResult.result) {
        console.log(crawlResult.result[0].text);
    }
    else {
        console.error('webster error:', crawlResult);
    }

})();