const { readFileSync } = require('fs');

class MochaParser {
    constructor(filePath) {
        this.filePath = filePath
    }

    parse() {
        this.test = this.readTestFile(this.filePath);
        const parsedTests = this.parseMochaTests(this.test);
        return parsedTests
    }

    readTestFile(filePath) {
        try {
            // Read the test file and return its content as a string
            return readFileSync(filePath, 'utf-8');
        } catch (error) {
            throw new Error(`Error reading test file: ${error.message}`);
        }
    }

    extractImports(inputString) {
        // Regex pattern to extract import and require statements
        const importPattern = /(?:const|let|var)\s+.*\s*=\s*require\s*\(\s*['"`](.*?)['"`]\s*\)\s*;?/g;
        let imports = '';
        let match;

        // Extract all the import/require statements
        while ((match = importPattern.exec(inputString)) !== null) {
            imports = imports + match[0].trim();
        }

        return imports;
    }

    parseMochaTests(inputString) {
        // Remove all comments from the input string
        const cleanedInput = this.cleanInput(inputString);

        const imports = this.extractImports(this.test);

        // Regex pattern to extract describe blocks
        const describePattern = /describe\s*\(\s*['"`](.*?)['"`]\s*,\s*function\s*\(\s*\)\s*{([^]*?)}/gm;

        const testBlocks = [];
        let match;

        // Extract all the 'describe' blocks
        while ((match = describePattern.exec(cleanedInput)) !== null) {
            const suiteName = match[1].trim();
            const suiteBody = match.input.trim();

            // Extract tests in the current describe block
            const tests = this.extractTests(suiteBody , imports);
            testBlocks.push({ suiteName, tests });
        }

        return testBlocks;
    }

    cleanInput(inputString) {
        // Remove single-line and multi-line comments
        return inputString.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '').trim();
    }

    extractTests(suiteBody, testImports = '') {
        // Regex pattern to extract it blocks
        const testPattern = /it\s*\(\s*['"`](.*?)['"`]\s*,\s*function\s*\(\s*\)\s*{([^]*?)}/gm;
        const tests = [];
        let testMatch;

        // Extract all the 'it' tests within the suite body
        while ((testMatch = testPattern.exec(suiteBody)) !== null) {
            const testDescription = testMatch[1].trim();
            const bodyRaw = testMatch[2].trim();
            const blockFunction = (`() => {\n${testImports}\n${bodyRaw}\n}`)
            // Create a function string for the body
            tests.push({
                description: testDescription,
                test: blockFunction
            });
        }

        return tests;
    }
}

module.exports = MochaParser;