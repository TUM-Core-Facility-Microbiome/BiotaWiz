<template>
  <div>
    <div class="text-lg font-bold">Running pipeline</div>
  </div>
  <br>
  <div>
    <!-- Iterate over preprocessingLogs -->
    <div v-for="(logProcessor, loggerName) in preprocessingLogProcessors" :key="loggerName">
      <div class="text-lg font-bold">{{ loggerName }}</div>
      <div>
        <div v-for="stage in logProcessor.logLines" class="text-sm pb-1 border-2 border-amber-950">
          <div v-for="log in stage" class="text-sm pb-2 border-2 border-amber-300">{{ log }}</div>
        </div>
      </div>
    </div>
  </div>
  <div>
    <!-- Iterate over main Logs -->
    <div class="text-lg font-bold">Main Log</div>
    <div>
      <div v-for="stage in mainLogProcessor.logLines" class="text-sm pb-1 border-2 border-amber-950">
        <div v-for="log in stage" class="text-sm pb-2 border-2 border-amber-300">{{ log }}</div>
      </div>
    </div>
  </div>
  <br>
</template>

<script setup lang="ts">
import {defineExpose, ref, onMounted, onUnmounted} from "vue";
import {Environment, LogSection} from "../../../../enums";


class LogProcessor {
  public logLines: string[][];  // log lines are grouped by section
  stagePointer: number;
  linePointer: number;
  carriagePosition: number;

  constructor() {
    this.logLines = [];
    this.stagePointer = -1;
    this.linePointer = 0;
    this.carriagePosition = 0;
  }

  private newStage() {
    this.logLines.push([[]]);
    this.stagePointer++;
    this.linePointer = 0;
    this.carriagePosition = 0;
  }

  /**
   * Add a new line at the current section
   * @private
   */
  private lineFeed() {
    // new line at array
    this.logLines[this.stagePointer].push('');
    this.linePointer++;
  }

  private carriageReturn() {
    // carriage return
    this.carriagePosition = 0;
  }

  public addLogLine(logLine: string, newStage: boolean = false) {
    if (newStage || this.stagePointer === -1) {
      this.newStage();
    }
    // split on CR and LF characters but keep them
    let chunks = logLine.split(/([\r\n])/);
    // filter out empty chunks
    chunks = chunks.filter(chunk => chunk !== '');
    // apply chunks
    for (let chunk of chunks) {
      if (chunk === '\n') {
        this.lineFeed();
      } else if (chunk === '\r') {
        this.carriageReturn();
      } else {
        if (this.carriagePosition === 0) {
          // replace the current line; this is not the correct way to handle this, but it needs to be fast
          this.logLines[this.stagePointer][this.linePointer] = chunk;
        } else {
          // append to the current line
          this.logLines[this.stagePointer][this.linePointer] += chunk;
        }
        this.carriagePosition += chunk.length;
      }
    }
  }
}

const preprocessingLogProcessors = ref<Map<string, LogProcessor>>({});
const mainLogProcessor = new LogProcessor();
let lastLoggerName: string | null = null;
const PYTHON_LOGGER_REGEX = /(?<asctime>[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}) - (?<name>.*):(?<filename>.*):(?<lineno>[0-9]*) - (?<levelname>[A-Z]{4,5}) - (?<message>.*)/;

onMounted(() => {
  // prepare the environment
  indexBridge.initializeEnvironment(Environment.IMNGS2CORE).then(() => {
    console.log("Backend initialized");
  }).catch(() => {
    console.log("Backend initialization failed");
  });
  // trigger the pipeline
  indexBridge.runImngs2Core().then(() => {
    console.log("IMNGS2-Core running");
  }).catch(() => {
    console.log("IMNGS2-Core pipeline failed");
  });
  // handle log messages
  indexBridge.handleLogToSection((section: LogSection, logMessage: string) => {
    if (section === LogSection.CONTAINER_STREAM) {
      console.debug("IMNGS2-Core log: " + logMessage);

      let m;
      if ((m = PYTHON_LOGGER_REGEX.exec(logMessage)) !== null) {  // regex matches; log line is first line in python logger
        const loggerName = m.groups?.name;

        let logProcessor: LogProcessor;
        if (loggerName.startsWith('run_imngs2.preprocessing.')) {  // preprocessing logger
          // add preprocessing logger if not present
          if (!preprocessingLogProcessors.value.hasOwnProperty(m.groups?.name)) {
            preprocessingLogProcessors.value[loggerName] = new LogProcessor();
          }
          logProcessor = preprocessingLogProcessors.value[loggerName];
          lastLoggerName = loggerName;
        } else {
          lastLoggerName = null;  // use the main logger
          logProcessor = mainLogProcessor;
        }

        logProcessor.addLogLine(m.groups?.message, true);
      } else {  // log line is a continuation of the previous log line
        let logProcessor: LogProcessor;
        if (lastLoggerName === null) {
          logProcessor = mainLogProcessor;  // use the main logger
        } else {
          logProcessor = preprocessingLogProcessors.value[lastLoggerName];
        }
        logProcessor.addLogLine(logMessage, false);
      }
    }
  });
});

async function rollback() {
  return new Promise<void>(async (resolve, reject) => {
    // send termination request
    await indexBridge.terminateImngs2CoreBackend();
    resolve();
  });
}

defineExpose({
  rollback,
});
</script>
