const assert = require('assert');
const mockServer = require('../mock/server');
const puppeteer = require('../../lib/browser/puppeteer');
const MOCK_SERVER_PORT = 8081;

describe('puppeteer usage', function () {
    before(function () {
        mockServer.listen(MOCK_SERVER_PORT);
    });
    after(function () {
        mockServer.close(MOCK_SERVER_PORT);
    });

    it('puppeteer normal usage', function (done) {
        const setSelector = '.container ul li';
        puppeteer.request({
            url: `http://127.0.0.1:${MOCK_SERVER_PORT}/?num=1`,
            headers: {
                'User-Agent': 'test case webster'
            },
            viewPort: {
                width: 1440,
                height: 960
            },
            actions: [
                {
                    type: "waitAfterPageLoading",
                    value: 100
                }
            ],
            targets: [
                {
                    selector: setSelector,
                    type: 'text',
                    field: 'name'
                }
            ]
        }).then(output => {
            const result = output.result;
            assert.strictEqual(17, result.name.length);

            assert.strictEqual(setSelector, result.name[0].selector);
            assert.strictEqual('Kodiak', result.name[0].text);
            assert.strictEqual(0, result.name[0].index);

            assert.strictEqual(setSelector, result.name[1].selector);
            assert.strictEqual('Cheetah', result.name[1].text);
            assert.strictEqual(1, result.name[1].index);

            assert.strictEqual(setSelector, result.name[2].selector);
            assert.strictEqual('Puma', result.name[2].text);
            assert.strictEqual(2, result.name[2].index);
            done();
        });
    });

});