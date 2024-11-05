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
        const cookies = parseCookies(req.headers.cookie);
        let query = url.parse(req.url, true).query;
        let mockNum = +query.num;
        let html = '<html><head></head><body>empty</nody></html>';
        // console.log('get ut access, num', mockNum);
        
        if (mockNum === 1) {
            html = fs.readFileSync(path.resolve(__dirname, `./mock${mockNum}.html`)).toString();
        }
        else if (mockNum === 2) {
            html = fs.readFileSync(path.resolve(__dirname, `./mock${mockNum}.html`)).toString();
            html = html.replace(/\{\{ ua \}\}/, ua);
        }
        else if (mockNum === 3) {
            html = fs.readFileSync(path.resolve(__dirname, `./mock${mockNum}.html`)).toString();
            const val = cookies.testCookie || 'unset';
            html = html.replace(/\{\{ cookieVal \}\}/, val);
        }
        else {
            html = '<html><head>wrong page</head><body>wrong page</nody></html>';
        }
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(html);
    }).listen(port);
};

function parseCookies(cookieHeader) {
    const cookies = {};
    if (cookieHeader && cookieHeader.split) {
        cookieHeader.split(';').forEach(cookie => {
            const [name, value] = cookie.split('=').map(c => c.trim());
            cookies[name] = decodeURIComponent(value);
        });
    }
    return cookies;
}

module.exports.close = function () {
    // inst.close();
};