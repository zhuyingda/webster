const mockRedisList = {};
const mockRedisHash = {};

function deepCopy(val) {
    if (!val) {
        return null;
    }
    return JSON.parse(JSON.stringify(val));
}

module.exports = {
    './redis': {
        rpush: function (option) {
            if (!mockRedisList[option.tableName]) {
                mockRedisList[option.tableName] = [];
            }
            mockRedisList[option.tableName].push(deepCopy(option.value));
            return new Promise((resolve) => {
                resolve(1);
            });
        },
        lpop: function (option) {
            if (!mockRedisList[option.tableName]) {
                throw new Error('stub-redis: error, invalid lpop tableName');
            }
            return new Promise((resolve) => {
                const item = mockRedisList[option.tableName].shift();
                resolve(item);
            });
        },
        hset: function (option) {
            if (!mockRedisHash[option.tableName]) {
                mockRedisHash[option.tableName] = [];
            }
            mockRedisHash[option.tableName][option.key] = deepCopy(option.value);
            return new Promise((resolve) => {
                resolve(1);
            });
        },
        hget: function (option) {
            if (!mockRedisHash[option.tableName]) {
                throw new Error('stub-redis: error, invalid hget tableName');
            }
            if (!mockRedisHash[option.tableName][option.key]) {
                throw new Error('stub-redis: error, invalid hget key');
            }
            return new Promise((resolve) => {
                resolve(JSON.stringify(mockRedisHash[option.tableName][option.key]));
            });
        },
        hgetall: function () {
            return new Promise((resolve) => {
                resolve([]);
            });
        },
        connect: function () {
            return;
        }
    }
};