const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
let inst;

module.exports.listen = function (port) {
    inst = http.createServer(function (req, res) {
        let query = url.parse(req.url, true).query;
        let mockNum = query.num || 1;
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(fs.readFileSync(path.resolve(__dirname, `./mock${mockNum}.html`)));
    }).listen(port);
};

module.exports.close = function () {
    inst.close();
};