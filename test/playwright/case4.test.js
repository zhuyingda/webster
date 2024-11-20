const assert = require('assert');
const mockServer = require('../mock/server');
const playwright = require('../../lib/browser/playwright');
const MOCK_SERVER_PORT = 8181;

describe('playwright usage for intruder', function () {
    this.timeout(60000);

    before(function () {
        mockServer.listen(MOCK_SERVER_PORT);
    });
    after(function () {
        mockServer.close(MOCK_SERVER_PORT);
    });

    it('playwright intruderMap block test1.js [chromium]', function (done) {
        const jsUrl = `http://127.0.0.1:${MOCK_SERVER_PORT}/test1.js`;
        playwright.request({
            type: 'chromium',
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

    it('playwright intruderMap block test1.js [firefox]', function (done) {
        const jsUrl = `http://127.0.0.1:${MOCK_SERVER_PORT}/test1.js`;
        playwright.request({
            type: 'firefox',
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

    it('playwright intruderMap block test1.js [webkit]', function (done) {
        const jsUrl = `http://127.0.0.1:${MOCK_SERVER_PORT}/test1.js`;
        playwright.request({
            type: 'webkit',
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