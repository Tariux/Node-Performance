const MochaParser = require("./MochaParser");
function getMochaTestContext(filePath) {
    const parse = new MochaParser(filePath).parse();

    const results = [];

    for (const suite of parse) {
        results[suite.suiteName] = []
        for (const test of suite.tests) {

            results[suite.suiteName].push({
                description: test.description,
                context: test.test,

            });
        }
    }

    return results;
}


module.exports = {getMochaTestContext}