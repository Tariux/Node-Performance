const { callMochaBench } = require("./MochaCaller");
const { getMochaTestContext } = require("./MochaContext");

const context = getMochaTestContext('./example.test.js');
console.log('con' , callMochaBench(context));