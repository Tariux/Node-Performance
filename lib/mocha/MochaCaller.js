const path = require('node:path');
const process = require('node:process');
const vm = require('node:vm');
const { Worker, isMainThread } = require('node:worker_threads');

async function callMochaBench(contextObject) {
  const results = [];

  const contextsKeys = Object.keys(contextObject);
  const contextsValues = Object.values(contextObject);
  for (let index = 0; index < contextsKeys.length; index++) {
    const tests = contextsValues[index];
    const contextKey = contextsKeys[index];
    const contextTests = await autoCallTestsFromContext(tests);
    results[contextKey] = contextTests
  }

  return results;
}

async function autoCallTestsFromContext(tests) {

  const results = []
  const testsKeys = Object.keys(tests);
  const testsValues = Object.values(tests);

  for (let index = 0; index < testsKeys.length; index++) {
    const test = testsValues[index];
    const testBench = await callTest(test);
    results[test.description] = testBench;
  }

  return results
}

async function runWorker(data) {
    return await new Promise((resolve, reject) => {
        const worker = new Worker(path.join((__dirname) , 'MochaWorker.js'), {
            workerData: data // Send data to the worker
        });

        worker.on('message', (result) => {
            // console.log(`Worker ${data.description}: ` , result);
            resolve(result);
        });

        worker.on('error', (error) => {
            console.log('XError: ', error);
            reject(error);
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
}

async function callTest(test) {
  const testFunction = (test.context).toString();

  // Cleanup memory before running the test
  if (global.gc) {
    global.gc();
  } else {
    console.warn('No GC hook! Start your program with `node --expose-gc`.');
  }


  const BenchStartMemory = process.memoryUsage().heapUsed;
  const BenchStartTime = process.hrtime.bigint(); // Use bigint for more stable timing

  let workerResponse

  if (isMainThread) {
    workerResponse = await runWorker({description: test.description , testFunction  })

  } else {
    throw Error('this is not main tread');
  }

  const BenchEndMemory = process.memoryUsage().heapUsed;
  const BenchEndTime = process.hrtime.bigint(); // Use bigint for more stable timing

  const BenchMemoryUsage = BenchEndMemory - BenchStartMemory;
  const BenchExecutionTime = Number(BenchEndTime - BenchStartTime) / 1000000; // convert to milliseconds

  console.log(
    `Bench executed in ${BenchExecutionTime} ms and used ${
      BenchMemoryUsage / 1024 / 1024
    } MB of memory`
  );

  return {
    status: workerResponse.status,
    BenchMemoryUsage,
    BenchExecutionTime,
    ...workerResponse.bench,
    
  };
}

module.exports = { callMochaBench };
