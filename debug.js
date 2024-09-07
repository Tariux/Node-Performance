const { exec } = require("child_process");

const imports =  [
    "const { expect, assert } = require('chai');",
    "const { describe, it } = require('mocha');"
  ]
  
  const tests =  [
    {
      "suiteName": "#sum0()",
      "tests": [
        {
          "description": "should add positive numbers",
          "body": `() => {
            ${imports.join('\n')}
            return 'meow'
          }`
        },
        {
          "description": "should add negative numbers",
          "body": `() => {
            ${imports.join('\n')}
            // Add negative numbers test logic here
          }`
        },
        {
          "description": "should add mixed numbers",
          "body": `() => {
            ${imports.join('\n')}
            // Add mixed numbers test logic here
          }`
        }
      ]
    }
  ]
  const func = tests[0].tests[0].body
  console.log(eval(func)());