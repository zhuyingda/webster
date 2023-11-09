/**
 * usage outside docker:
 * docker run --tty -e URL="https://www.tiktok.com/" -e Cookie="foo=1234; bar=abcd" -e UA="Mozilla/115.0 AppleWebKit/537.36 Chrome/116" imageId node crawler.js
 * usage inside docker:
 * env URL="https://www.tiktok.com/" Cookie="foo=1234; bar=abcd" UA="Mozilla/115.0 AppleWebKit/537.36 Chrome/116" node crawler.js
 */
const { spider } = require('webster');

class MySpider extends spider {
    get defUserAgent() {
        return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36`;
    }
    get defDeviceType() {
        return 'pc';
    }
    async parseHtml(html) {
        return true;
    }
}

(async () => {
    const url = process.env.URL || `https://www.tiktok.com/`;
    const cookie = process.env.Cookie || ``;
    const ua = process.env.UA || `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36`;
    if (process.env.debug) {
        console.log('crawl input:', url, cookie, ua);
    }

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
        customHeaders: {
            'Cookie': cookie,
            'User-Agent': ua,
        }
    });

    if (process.env.debug) {
        console.log('crawling start');
    }
    let crawlResult = await spider.startRequest(url);
    if (process.env.debug) {
        console.log('crawling end');
    }
    if (crawlResult.result) {
        console.log(crawlResult.result[0].text);
        process.exit(0);
    }
    else {
        console.error('crawling error:', crawlResult);
        process.exit(1);
    }
})();