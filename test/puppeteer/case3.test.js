const assert = require('assert');
const mockServer = require('../mock/server');
const puppeteer = require('../../lib/browser/puppeteer');
const MOCK_SERVER_PORT = 8181;

describe('puppeteer usage for cookie', function () {
    this.timeout(60000);

    before(function () {
        mockServer.listen(MOCK_SERVER_PORT);
    });
    after(function () {
        mockServer.close(MOCK_SERVER_PORT);
    });

    it('puppeteer ua, viewport set usage', function (done) {
        const testCookieVal = 'abcdefg';
        puppeteer.request({
            url: `http://127.0.0.1:${MOCK_SERVER_PORT}/?num=3`,
            cookies: {
                val1: 100,
                val2: 200,
                testCookie: 'abcdefg'
            },
            actions: [
                {
                    type: "waitAfterPageLoading",
                    value: 100
                }
            ],
            targets: [
                {
                    selector: '#ck',
                    type: 'text',
                    field: 'cookie'
                }
            ]
        }).then(output => {
            assert.strictEqual(output.result.cookie[0].text, testCookieVal);
            done();
        });
    });

});