<template>
  <div>
    <div class="text-lg font-bold">Running pipeline</div>
  </div>
  <br>
  <div>
    <!-- Iterate over preprocessingLogs -->
    <div v-for="(logProcessor, loggerName) in logProcessors" :key="loggerName">
      <div class="text-lg font-bold">{{ loggerName }}</div>
      <div>
        <div v-for="stage in logProcessor.logLines" class="text-sm pb-1 border-2 border-amber-950">
          <div v-for="log in stage" class="text-sm pb-2 border-2 border-amber-300">{{ log }}</div>
        </div>
      </div>
    </div>
  </div>
  <br>
  {{ logProcessors }}
  <br>
  <div>
    <div v-for="log in logs" :key="log" class="text-sm pb-1 border-2">{{ log }}</div>
  </div>
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
    this.carriagePosition = 0;
  }

  private carriageReturn() {
    // carriage return
    this.carriagePosition = 0;
  }

  public addLogLine(logLine: string, newStage: boolean = false) {
    if (newStage || this.stagePointer === -1) {
      this.newStage();
    }
    console.log(`Adding log line '${JSON.stringify(logLine)}' at stage ${this.stagePointer}`);
    // add character by character
    for (let i = 0; i < logLine.length; i++) {
      if (logLine[i] === '\n') {
        // interpret as CRLF
        this.carriageReturn();
        this.lineFeed();
      } else if (logLine[i] === '\r') {
        this.carriageReturn();
      } else {
        // insert character at current line
        let currentLine = this.logLines[this.stagePointer][this.linePointer];
        // convert to array to insert character
        let lineArray = Array.from(currentLine);
        lineArray.splice(this.carriagePosition, 0, logLine[i]);
        this.logLines[this.stagePointer][this.linePointer] = lineArray.join('');
        this.carriagePosition++;
      }
    }
  }
}

const logs = ref<string[]>([]);
const logProcessors = ref<Map<string, LogProcessor>>({});
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
      console.log(logProcessors.value);
      console.log("IMNGS2-Core log: " + logMessage);

      let m;
      if ((m = PYTHON_LOGGER_REGEX.exec(logMessage)) !== null) {  // regex matches; log line is first line in python logger
        logs.value.push(logMessage);

        const loggerName = m.groups?.name;
        lastLoggerName = loggerName;
        if (!logProcessors.value.hasOwnProperty(m.groups?.name)) {
          logProcessors.value[loggerName] = new LogProcessor();
        }

        let logProcessor = logProcessors.value[loggerName];
        logProcessor.addLogLine(logMessage, true);
      } else {  // log line is a continuation of the previous log line
        if (lastLoggerName !== null) {
          let logProcessor = logProcessors.value[lastLoggerName];
          logProcessor.addLogLine(logMessage, false);
        } else {
          console.error("No logger found for log line: " + logMessage);
        }
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
