const path = require('path');
const log4js = require('log4js');

function initLogger() {
    let configOption = {
        appenders: {
            webster: {}
        },
        categories: {
            default: {
                appenders: ['webster']
            }
        }
    };
    if (!!process.env.MOD) {
        configOption.appenders.webster = {
            type: 'stdout'
        };
        if (process.env.MOD === 'browser') {
            configOption.categories.default.level = 'trace';
        }
        else {
            configOption.categories.default.level = process.env.MOD;
        }
    }
    else {
        let curFile = require.main.filename.split('/');
        curFile = curFile[curFile.length - 1];
        if (/\.js$/.test(curFile)) {
            curFile = curFile.replace(/\.js$/, '')
        }
        configOption.appenders.webster = {
            type: 'file',
            filename: path.resolve(process.env.HOME, `.webster/${curFile}.log`)
        };
        configOption.categories.default.level = 'info';
    }
    
    log4js.configure(configOption);
}

function isRunningTests() {
    return process.argv.some(arg => arg.includes('mocha'));
}

const logger = log4js.getLogger('webster');

const loggerExport = {
    fatal(msg) {
        logger.fatal(msg);
        console.error(msg);
    },
    error(msg) {
        logger.error(msg);
        console.error(msg);
    },
    warn(msg) {
        logger.warn(msg);
        console.warn(msg);
    },
    info(msg) {
        logger.info(msg);
        console.info(msg);
    },
    debug(msg) {
        logger.debug(msg);
        console.log(msg);
    },
    trace(msg) {
        logger.trace(msg);
        console.log(msg);
    }
};

if (process.env.prod) {
    loggerExport.debug = () => {};
    loggerExport.trace = () => {};
    loggerExport.info = (msg) => {
        logger.info(msg);
    };
    loggerExport.warn = (msg) => {
        logger.warn(msg);
    };
    loggerExport.error = (msg) => {
        logger.error(msg);
    };
    loggerExport.fatal = (msg) => {
        logger.fatal(msg);
    };
}

if (isRunningTests) {
    loggerExport.debug = () => {};
    loggerExport.trace = () => {};
    loggerExport.info = (msg) => {
        // test mock
    };
    loggerExport.warn = (msg) => {
        // test mock
    };
    loggerExport.error = (msg) => {
        // test mock
    };
    loggerExport.fatal = (msg) => {
        // test mock
    };
}


module.exports.initLogger = initLogger;

module.exports.getLogger = () => {
    return loggerExport;
};