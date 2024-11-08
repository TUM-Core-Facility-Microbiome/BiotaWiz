<template>
  <div>
    <div class="text-lg font-bold">Running pipeline</div>
  </div>
  <br>
<!--  <div>-->
<!--    &lt;!&ndash; Iterate over preprocessingLogs &ndash;&gt;-->
<!--    <div v-for="(logProcessor, loggerName) in preprocessingLogProcessors" :key="loggerName">-->
<!--      <div class="text-lg font-bold">{{ loggerName }}</div>-->
<!--      <div>-->
<!--        <div v-for="stage in logProcessor.logLines" class="text-sm pb-1 border-2 border-amber-950">-->
<!--          <div v-for="log in stage" class="text-sm pb-2 border-2 border-amber-300">{{ log }}</div>-->
<!--        </div>-->
<!--      </div>-->
<!--    </div>-->
<!--  </div>-->

  <!--    <li class="flex items-center">-->
  <!--      <div role="status">-->
  <!--        <svg class="w-4 h-4 me-2 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">-->
  <!--          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>-->
  <!--        </svg>-->
  <!--        <span class="sr-only">Finished</span>-->
  <!--      </div>-->
  <!--      Upload your file to our website-->
  <!--    </li>-->

  <div>
    <!-- Iterate over main Logs -->
    <h2 class="pt-2 mb-2 text-lg font-semibold text-gray-900 dark:text-white">Main Log</h2>
    <div>
      <div v-for="stage in mainLogProcessor.logLines" class="text-sm pb-1 border-2 border-amber-950">
        <div v-for="log in stage" class="text-sm pb-2 border-2 border-amber-300">{{ log }}</div>
      </div>
    </div>
  </div>
  <br>
  <h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Preprocessing samples</h2>
  <ul class="max-w-md space-y-1 text-gray-500 list-inside dark:text-gray-400">

    <li class="flex items-center" v-for="(logProcessor, loggerName) in preprocessingLogProcessors" :key="loggerName">
      <template v-if="logProcessor.lastMessage() === '# Clean Up: Started'">
        <!-- Finished status -->
        <div role="status">
          <svg class="w-4 h-4 me-2 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
          </svg>
          <span class="sr-only">Finished</span>
        </div>
      </template>
      <template v-else>
        <!-- Processing status -->
        <div role="status">
          <svg aria-hidden="true" class="w-4 h-4 me-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
          <span class="sr-only">Processing</span>
        </div>
      </template>

      {{ loggerName }}
    </li>
  </ul>
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

  public lastMessage() {
    const maxStage = this.logLines.length - 1;
    const maxLine = this.logLines[maxStage].length - 1;
    return this.logLines[maxStage][maxLine];
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

let logHandlerFn: CallableFunction<LogSection, string> = processLogLine;
const preprocessingLogProcessors = ref<Map<string, LogProcessor>>({});
const mainLogProcessor = ref<LogProcessor>(new LogProcessor());
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
    logHandlerFn(section, logMessage);
  });
});

function processLogLine(section: LogSection, logMessage: string) {
  if (section === LogSection.CONTAINER_STREAM) {
    console.debug(`IMNGS2-Core log: ${JSON.stringify(logMessage)}`);

    let m;
    if ((m = PYTHON_LOGGER_REGEX.exec(logMessage)) !== null) {  // regex matches; log line is first line in python logger
      const loggerName = m.groups?.name;

      let logProcessor: LogProcessor;
      if (loggerName.startsWith('run_imngs2.preprocessing.')) {  // preprocessing logger
        // add preprocessing logger if not present
        if (!preprocessingLogProcessors.value.hasOwnProperty(m.groups?.name)) {
          preprocessingLogProcessors.value[loggerName] = new LogProcessor();
        }
        lastLoggerName = loggerName;
        logProcessor = preprocessingLogProcessors.value[loggerName];
      } else {
        lastLoggerName = null;  // use the main logger
        logProcessor = mainLogProcessor.value;
      }

      logProcessor.addLogLine(m.groups?.message, true);
    } else {  // log line is a continuation of the previous log line
      let logProcessor: LogProcessor;
      console.log("Last logger name: " + lastLoggerName);
      if (lastLoggerName === null) {
        logProcessor = mainLogProcessor.value;  // use the main logger
      } else {
        logProcessor = preprocessingLogProcessors.value[lastLoggerName];
      }
      logProcessor.addLogLine(logMessage, false);
    }
  }
}

function muteLogHandler(section: LogSection, logMessage: string) {
  console.debug("Muted log handler: " + logMessage);
  return;
}

async function rollback() {
  return new Promise<void>(async (resolve, reject) => {
    // mute log handler
    logHandlerFn = muteLogHandler;
    // send termination request
    await indexBridge.terminateImngs2CoreBackend();
    resolve();
  });
}

defineExpose({
  rollback,
});
</script>
