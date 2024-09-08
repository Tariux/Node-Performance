const { parentPort, workerData } = require('worker_threads');
const ivm = require('isolated-vm');
const process = require('process');

async function runWorkerIsolate(workerData) {
  if (global.gc) {
    global.gc();
  } else {
    console.warn('No GC hook! Start your program with `node --expose-gc`.');
  }

  const testFunction = workerData.testFunction;
  const repetitions = workerData.repetitions || 1;
  const options = {
    timeout: 10000, // 1 second timeout
    memoryLimit: 128, // 32 MB memory limit
  };

  const isolate = new ivm.Isolate({ memoryLimit: options.memoryLimit });
  const context = await isolate.createContext();
  const script = await isolate.compileScript(testFunction);
  const callableFunction = eval(testFunction)

  let totalMemoryUsage = 0;
  let totalExecutionTime = 0;
  let totalCpuUsage = 0;
  let minExecutionTime = Number.MAX_VALUE;
  let maxExecutionTime = 0;
  let minMemoryUsage = Number.MAX_VALUE;
  let maxMemoryUsage = 0;
  let executionTimes = [];
  let memoryUsages = [];
  let cpuUsages = [];

  for (let i = 0; i < repetitions; i++) {
    try {
      const startCpuUsage = process.cpuUsage();
      if (global.gc) global.gc();
      const startMemory = process.memoryUsage().heapUsed;
      const startTime = process.hrtime.bigint();

      await callableFunction()

      const endMemory = process.memoryUsage().heapUsed;
      const endTime = process.hrtime.bigint();
      const endCpuUsage = process.cpuUsage(startCpuUsage);

      if (global.gc) global.gc();

      const memoryUsage = endMemory - startMemory;
      const executionTime = Number(endTime - startTime) / 1000000; // milliseconds
      const cpuUsage = (endCpuUsage.user + endCpuUsage.system) / 1000; // milliseconds

      // Log to debug
      // console.log(`Iteration ${i + 1}: Execution Time = ${executionTime} ms, CPU Usage = ${cpuUsage} ms`);

      totalMemoryUsage += memoryUsage;
      totalExecutionTime += executionTime;
      totalCpuUsage += cpuUsage;
      minExecutionTime = Math.min(minExecutionTime, executionTime);
      maxExecutionTime = Math.max(maxExecutionTime, executionTime);
      minMemoryUsage = Math.min(minMemoryUsage, memoryUsage);
      maxMemoryUsage = Math.max(maxMemoryUsage, memoryUsage);
      executionTimes.push(executionTime);
      memoryUsages.push(memoryUsage);
      cpuUsages.push(cpuUsage);
    } catch (error) {
      console.log(error);
      parentPort.postMessage({
        status: 'Fail',
        error,
      });
      return;
    }
  }

  const averageMemoryUsage = totalMemoryUsage / repetitions;
  const averageExecutionTime = totalExecutionTime / repetitions;
  const averageCpuUsage = totalCpuUsage / repetitions;

  parentPort.postMessage({
    status: 'Success',
    bench: {
      repetitions,
      averageExecutionTime,
      minExecutionTime,
      maxExecutionTime,
      averageMemoryUsage: averageMemoryUsage / 1024 / 1024,
      minMemoryUsage: minMemoryUsage / 1024 / 1024,
      maxMemoryUsage: maxMemoryUsage / 1024 / 1024,
      averageCpuUsage,
    },
  });
}

runWorkerIsolate(workerData);
