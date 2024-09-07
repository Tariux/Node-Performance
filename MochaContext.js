const vm = require('node:vm');
const MochaParser = require("./MochaParser");
function getMochaTestContext(filePath) {
    const parse = new MochaParser(filePath).parse();
    const contextifiedObject = vm.createContext({
        require,
        console
    });

    const options = {
        timeout: 1000, // 1 second timeout
        memoryLimit: 1 * 1024 * 1024 // 128 MB memory limit
    };

    const results = [];

    for (const suite of parse) {
        results[suite.suiteName] = []
        for (const test of suite.tests) {
            console.log('test.test}' , test.test);
            const script = new vm.Script(`
              ${test.test}
            `);
            const scriptContext = script.runInContext(contextifiedObject, options);
            results[suite.suiteName].push({
                description: test.description,
                context: scriptContext,

            });
        }
    }

    return results;
}


module.exports = {getMochaTestContext}