const assert = require('assert');

describe('webster unit test', function() {
    describe('task module test', function() {
        const Task = require('../lib/task');
        let task1 = new Task({
            spiderType: 'plain',
            url: 'https://www.baidu.com/s?wd=javascript',
            targets: [
                {
                    selector: '.result.c-container h3',
                    type: 'text',
                    field: 'title'
                }
            ]
        }).dump();
        let task2 = new Task({
            spiderType: 'plain',
            url: 'https://www.baidu.com/s?wd=javascript',
            targets: [
                {
                    selector: '.result.c-container h3',
                    type: 'text',
                    field: 'title'
                }
            ]
        }).dump();

        it('should not two task id equal', function() {
            assert.notEqual(task1.id, task2.id);
        });
        
        it('should two task url equal', function () {
            assert.equal(task1.url, task2.url);
        });
    });

});