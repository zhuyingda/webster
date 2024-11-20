const assert = require('assert');
const mockServer = require('../mock/server');
const puppeteer = require('../../lib/browser/puppeteer');
const MOCK_SERVER_PORT = 8181;

describe('puppeteer usage for intruder', function () {
    this.timeout(60000);

    before(function () {
        mockServer.listen(MOCK_SERVER_PORT);
    });
    after(function () {
        mockServer.close(MOCK_SERVER_PORT);
    });

    it('puppeteer intruderMap block test1.js', function (done) {
        const jsUrl = `http://127.0.0.1:${MOCK_SERVER_PORT}/test1.js`;
        puppeteer.request({
            url: `http://127.0.0.1:${MOCK_SERVER_PORT}/?num=4`,
            actions: [
                {
                    type: "waitAfterPageLoading",
                    value: 500
                }
            ],
            targets: [
                {
                    selector: '#container',
                    type: 'text',
                    field: 'result'
                }
            ],
            intruderMap: {
                [jsUrl]: {
                    payload: 'empty'
                }
            },
        }).then(output => {
            assert.strictEqual(output.result.result[0].text, 'foo');
            done();
        });
    });

});