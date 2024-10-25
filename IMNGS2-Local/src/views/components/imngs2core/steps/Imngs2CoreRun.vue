<template>
  <div>
    <div class="text-lg font-bold">Running pipeline</div>
  </div>
  <br>
  <div>
    <!-- Iterate over preprocessingLogs -->
    <div v-for="(logs, loggerName) in preprocessingLogs" :key="loggerName">
      <div class="text-lg font-bold">{{ loggerName }}</div>
      <div>
        <div v-for="(logarr, timestamp) in logs" :key="logarr" class="text-sm pb-1 border-2 border-amber-950">
          <div class="text-sm font-bold">{{ timestamp }}</div>
          <div v-for="log in logarr" :key="log" class="text-sm pb-2 border-2 border-amber-300">{{ log }}</div>
          <small class="text-red-800">{{ logarr }}</small>
        </div>
      </div>
    </div>
  </div>
  <br>
  {{ preprocessingLogs }}
  <br>
  <div>
    <div v-for="log in logs" :key="log" class="text-sm pb-1 border-2">{{ log }}</div>
  </div>
</template>

<script setup lang="ts">
import {defineExpose, ref, onMounted, onUnmounted} from "vue";
import {Environment, LogSection} from "../../../../enums";


class LogProcessor {
  logLines: string[][];  // log lines are grouped by section
  sectionPointer: number;
  insertPointer: number;

  constructor() {
    this.logLines = [[]];
    this.sectionPointer = 0;
    this.insertPointer = 0;
  }

  private addSection() {
    this.logLines.push([]);
    this.sectionPointer++;
    this.insertPointer = 0;
  }

  /**
   * Add a new line at the current section
   * @private
   */
  private newLine() {
    // new line at array
    this.logLines[this.sectionPointer].push('');
    this.insertPointer++;
  }

  public addLogLine(logLine: string, newSection: boolean = false) {
    if (newSection) {
      this.addSection();
    }
    this.logLines[this.sectionPointer][this.insertPointer] += logLine;
    this.newLine();
  }
}

const logs = ref<string[]>([]);
const preprocessingLogs = ref<Map<string, Map<string, string[]>>>({});
let preprocessingLastLoggedTo: string | null = null;
const preprocessingPerLoggerLastLoggedTo = ref<Map<string, string>>({});


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
});

const PYTHON_LOGGER_REGEX = /(?<asctime>[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}) - (?<name>.*):(?<filename>.*):(?<lineno>[0-9]*) - (?<levelname>[A-Z]{4,5}) - (?<message>.*)/;

indexBridge.handleLogToSection((section: LogSection, logMessage: string) => {
  if (section === LogSection.CONTAINER_STREAM) {
    console.log("IMNGS2-Core log: " + logMessage);

    let m;
    if ((m = PYTHON_LOGGER_REGEX.exec(logMessage)) !== null) {  // regex matches; log line is first line in python logger
      logs.value.push(logMessage);
      const loggerName = m.groups?.name;
      if (loggerName.startsWith('run_imngs2.preprocessing.')) {
        if (!preprocessingLogs.value.hasOwnProperty(m.groups?.name)) {
          preprocessingLogs.value[m.groups?.name] = {};
        }
        preprocessingLogs.value[m.groups?.name][m.groups?.asctime] = [m.groups?.message];
        preprocessingLastLoggedTo = m.groups?.name;
        preprocessingPerLoggerLastLoggedTo.value[m.groups?.name] = m.groups?.asctime;
      } else {
        preprocessingLastLoggedTo = null;
      }
    } else {  // log line is a continuation of the previous log line
      logs.value[logs.value.length - 1] += '\n' + logMessage;
      if (preprocessingLastLoggedTo !== null) {
        const timestamp = preprocessingPerLoggerLastLoggedTo.value[preprocessingLastLoggedTo];
        preprocessingLogs.value[preprocessingLastLoggedTo][timestamp].push(logMessage);
      }
    }
  }
});

async function rollback() {
  return new Promise<void>(async (resolve, reject) => {
    await indexBridge.terminateImngs2CoreBackend();
    resolve();
  });
}

defineExpose({
  rollback,
});
</script>
