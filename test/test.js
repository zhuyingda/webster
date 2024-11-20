const Mocha = require('mocha');
const Path = require('path');

const mocha = new Mocha();
mocha.addFile(Path.resolve(__dirname, './task/task.test.js'));
mocha.addFile(Path.resolve(__dirname, './integration/integration.test.js'));
mocha.addFile(Path.resolve(__dirname, './puppeteer/case1.test.js'));
mocha.addFile(Path.resolve(__dirname, './puppeteer/case2.test.js'));
mocha.addFile(Path.resolve(__dirname, './puppeteer/case3.test.js'));
mocha.addFile(Path.resolve(__dirname, './puppeteer/case4.test.js'));
mocha.addFile(Path.resolve(__dirname, './playwright/case1.test.js'));
mocha.addFile(Path.resolve(__dirname, './playwright/case2.test.js'));
mocha.addFile(Path.resolve(__dirname, './playwright/case3.test.js'));
mocha.addFile(Path.resolve(__dirname, './playwright/case4.test.js'));

mocha.run()
  .on('end', () => {
    console.log('All tests finished');
    process.exit(0);
  });