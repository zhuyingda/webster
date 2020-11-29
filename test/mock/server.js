const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
let inst = null;

module.exports.listen = function (port) {
    if (inst !== null) {
        return;
    }
    inst = http.createServer(function (req, res) {
        let ua = req.headers['user-agent'];
        let query = url.parse(req.url, true).query;
        let mockNum = query.num || 1;
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        let html = fs.readFileSync(path.resolve(__dirname, `./mock${mockNum}.html`)).toString();
        html = html.replace(/\{\{ ua \}\}/, ua);
        res.end(html);
    }).listen(port);
};

module.exports.close = function () {
    // inst.close();
};