const assert = require('assert');
const mockServer = require('../mock/server');
const puppeteer = require('../../lib/browser/puppeteer');
const MOCK_SERVER_PORT = 8181;

describe('puppeteer usage for click and w,h,ua', function () {
    this.timeout(60000);

    before(function () {
        mockServer.listen(MOCK_SERVER_PORT);
    });
    after(function () {
        mockServer.close(MOCK_SERVER_PORT);
    });

    it('puppeteer ua, viewport set usage', function (done) {
        const
            setUA = 'test case webster',
            setW = 1555,
            setH = 1001
            ;
        puppeteer.request({
            url: `http://127.0.0.1:${MOCK_SERVER_PORT}/?num=2`,
            headers: {
                'User-Agent': setUA
            },
            viewPort: {
                width: setW,
                height: setH
            },
            actions: [
                {
                    type: "waitAfterPageLoading",
                    value: 100
                },
                {
                    type: 'clickSelectorElement',
                    selector: '#trigger_btn'
                }
            ],
            targets: [
                {
                    selector: '#w',
                    type: 'text',
                    field: 'width'
                },
                {
                    selector: '#h',
                    type: 'text',
                    field: 'height'
                },
                {
                    selector: '#n',
                    type: 'text',
                    field: 'ua'
                }
            ]
        }).then(output => {
            assert.strictEqual(Number(output.result.width[0].text), setW);
            assert.strictEqual(Number(output.result.height[0].text), setH);
            assert.strictEqual(output.result.ua[0].text, setUA);
            done();
        });
    });

});