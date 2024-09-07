const process = require('node:process');
const vm = require('node:vm');

function callMochaBench(contextObject) {
    const results = [];

    const contextsKeys = Object.keys(contextObject);
    const contextsValues = Object.values(contextObject);
    for (let index = 0; index < contextsKeys.length; index++) {
        const tests = contextsValues[index];
        const contextKey = contextsKeys[index];
        const contextTests = autoCallTestsFromContext(tests, results, contextKey);
    }

    return results;
}

function autoCallTestsFromContext(tests, results, contextKey) {
    const testsKeys = Object.keys(tests);
    const testsValues = Object.values(tests);

    for (let index = 0; index < testsKeys.length; index++) {
        const test = testsValues[index];
        const testBench = callTest(test);
        results.push({
            suiteName: contextKey,
            testName: test.description,
            memoryUsage: testBench.memoryUsage,
            executionTime: testBench.executionTime
        });
    }
}

function callTest(test) {
    const testFunction = test.context;
    console.log('testFunction', testFunction.toString());

    // Cleanup memory before running the test
    if (global.gc) {
        global.gc();
    } else {
        console.warn('No GC hook! Start your program with `node --expose-gc`.');
    }

    const usedBefore = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`Memory usage before test: ${Math.floor(usedBefore)} MB`);
    // Run the test once
    const options = {
        timeout: 1000, // 1 second timeout
        memoryLimit: 1 * 1024 * 1024 // 1 MB memory limit
    };

    

    const script = new vm.Script(`(${testFunction.toString()})()`);
    const contextifiedObject = vm.createContext({
        require,
        console
    });

    const startMemory = process.memoryUsage().heapUsed;
    const startTime = process.hrtime.bigint(); // Use bigint for more stable timing
    console.time("startTimeX");

    script.runInContext(contextifiedObject, options);

    const endMemory = process.memoryUsage().heapUsed;
    const endTime = process.hrtime.bigint(); // Use bigint for more stable timing
    console.timeEnd("startTimeX");

    const usedAfter = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`Memory usage after test: ${Math.floor(usedAfter)} MB`);

    const memoryUsage = endMemory - startMemory;
    const executionTime = Number(endTime - startTime) / 1000000; // convert to milliseconds

    console.log(`Test executed in ${executionTime} ms and used ${memoryUsage / 1024 / 1024} MB of memory`);

    return {
        testName: test.description,
        memoryUsage: memoryUsage,
        executionTime: executionTime
    }
}

module.exports = { callMochaBench }