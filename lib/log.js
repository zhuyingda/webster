const path = require('path');
const log4js = require('log4js');

const logger = log4js.getLogger('webster');

const loggerExport = {
    fatal(msg) {
        logger.fatal(msg);
    },
    error(msg) {
        logger.error(msg);
    },
    warn(msg) {
        logger.warn(msg);
    },
    info(msg) {
        logger.info(msg);
    },
    debug(msg) {
        logger.debug(msg);
    },
    trace(msg) {
        logger.trace(msg);
    }
};

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
        switch (process.env.MOD) {
            case 'browser':
            case 'trace':
                configOption.categories.default.level = 'trace';
                break;
            case 'debug':
            case 'info':
            case 'warn':
            case 'error':
                configOption.categories.default.level = process.env.MOD;
                break;
            default:
                throw new Error(`MOD not support ${process.env.MOD}`);
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

if (isRunningTests()) {
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