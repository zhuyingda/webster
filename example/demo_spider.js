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