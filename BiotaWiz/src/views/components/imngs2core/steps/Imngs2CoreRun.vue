<template>
  <div>
    <div class="text-lg font-bold">Running pipeline</div>
    <div class="text-sm text-gray-700">
      You should see the logs of IMNGS2-Core here. Output will be written to your selected base directory:
      <br>
      {{ state.baseDir }}
    </div>
    <p>
      <div v-if="state.analysisDir">
        <div class="flex">
          <div class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div>&nbsp;Analysis done. Analysis directory ready.</div>
        </div>
        <p>We recommend the
          <a @click="openExternal('https://exbio.wzw.tum.de/namco/')"
             class="underline cursor-pointer text-blue-500">Namco microbiome explorer</a>
          for downstream analysis.
        </p>
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" @click="openAnalysisDirectory">Open analysis directory</button>
      </div>
    </p>
  </div>
  <br>
  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
    Main logs
    <label class="inline-flex items-center cursor-pointer float-right pb-1">
      <input type="checkbox" v-model="state.autoScroll" class="sr-only peer">
      <div class="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
      <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">auto-scroll</span>
    </label>
  </h2>
  <div class="p-2 text-xs font-mono bg-gray-800 text-white rounded-lg text-wrap w-100 max-h-80 min-h-80 overflow-y-auto" id="terminal">
    <div class="space-y-2">
      <details class="group [&_summary::-webkit-details-marker]:hidden" v-for="stage in mainLogProcessor.stages" open>
        <summary class="flex cursor-pointer items-center justify-between gap-1.5 rounded-lg bg-gray-900 group-open:bg-gray-600 p-2 pl-3 text-white">
          <h2 class="font-medium group-open:font-bold">
            <span class="inline-flex">
              <span v-if="mainLogProcessor.stageHasProblems(stage)"
                    class="inline-flex items-center bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 mr-2 rounded-full dark:bg-red-900 dark:text-red-300"
              >
                <span class="w-2 h-2 me-1 bg-red-500 rounded-full"></span>
                Warnings
              </span>
              <span class="mt-0.5">{{ stage[0]?.messages[0] }}</span>
            </span>
          </h2>

          <svg
              class="size-5 shrink-0 transition duration-300 group-open:-rotate-180"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>

        <p class="mt-2 px-2 leading-relaxed text-white">
          <table class="w-[625px] max-w-[625px] table-fixed">
            <tr v-for="line in stage">
              <td :class="{ 'text-orange-500': line.level == 'WARNING', 'text-red-500': line.level == 'CRITICAL' || line.level == 'ERROR' }" class="w-[300px] break-all overflow-hidden pb-2">
                <div v-for="m of line.messages">{{ m }}</div>
              </td>
            </tr>
          </table>
        </p>
      </details>
    </div>
  </div>
  <div v-if="Object.keys(preprocessingLogProcessors ?? {}).length > 0" class="pt-4">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Sample-wise preprocessing logs</h2>
    <div class="bg-orange-100 border-t border-b border-orange-500 text-orange-700 px-2 py-1 mt-0 mb-2" role="alert">
      <span class="font-bold text-sm">Notice: </span>
      <span class="text-sm">Samples that were preprocessed in a previous run are not shown.
        Some files are expected to produce warnings. See <a @click="openDocumentationPreprocessing()" class="underline cursor-pointer text-blue-500">documentation</a>.
      </span>
    </div>
    <div class="p-2 text-xs font-mono bg-gray-800 text-white rounded-lg text-wrap w-100 max-h-80 min-h-80 overflow-y-auto" id="preprocessing-terminal">
      <div class="space-y-2">
        <details class="group [&_summary::-webkit-details-marker]:hidden" v-for="(logProcessor, loggerName) in preprocessingLogProcessors" :key="loggerName">
          <summary class="flex cursor-pointer items-center justify-between gap-1.5 rounded-lg bg-gray-900 group-open:bg-gray-600 p-2 pl-3 text-white">
            <h2 class="font-medium group-open:font-bold">
              <span class="inline-flex">
                <svg v-if="logProcessor.lastMessage() === '# Finished Preprocessing'"
                     aria-hidden="true"
                     class="w-4 h-4 me-2 text-green-500 dark:text-green-400 flex-shrink-0"
                     viewBox="0 0 20 20"
                     fill="currentColor"
                     xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
                </svg>
                <span v-else-if="logProcessor.hasProblems()"
                      class="inline-flex items-center bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 mr-2 rounded-full dark:bg-red-900 dark:text-red-300"
                >
                  <span class="w-2 h-2 me-1 bg-red-500 rounded-full"></span>
                  Warnings
                </span>
                <svg v-else
                     aria-hidden="true"
                     class="w-4 h-4 me-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                     viewBox="0 0 100 101"
                     fill="none"
                     xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span class="mt-0.5">{{ loggerName }}</span>
              </span>
            </h2>

            <svg
                class="size-5 shrink-0 transition duration-300 group-open:-rotate-180"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          <p class="mt-2 px-2 leading-relaxed text-white">
            <table class="w-[625px] max-w-[625px] table-fixed">
              <template v-for="stage in logProcessor.stages">
                <tr v-for="line in stage">
                  <td :class="{ 'text-orange-500': line.level == 'WARNING', 'text-red-500': line.level == 'CRITICAL' || line.level == 'ERROR' }" class="w-[300px] break-all overflow-hidden pb-2">
                    <div v-for="m of line.messages">{{ m }}</div>
                  </td>
                </tr>
              </template>
            </table>
          </p>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {defineExpose, ref, reactive, onActivated, watchEffect} from "vue";
import {Environment, LogSection} from "../../../../enums";

class IMNGS2CoreLogLine {
  level: string | null;
  messages: string[];
  timestamp: string | null;
  name: string | null;
  filename: string | null;
  lineno: number | null;

  linePointer: number;
  carriagePosition: number;

  constructor() {
    this.messages = [];
    this.linePointer = 0;
    this.carriagePosition = 0;
  }

  public hasProblems() {
    return this.level === 'WARNING' || this.level === 'CRITICAL' || this.level === 'ERROR';
  }

  /**
   * Add a new line
   * @private
   */
  private lineFeed() {
    // new line at array
    this.messages.push('');  // add a new empty line
    this.linePointer++;
  }

  /**
   * Add a carriage return
   * @private
   */
  private carriageReturn() {
    // carriage return
    this.carriagePosition = 0;
  }

  public addLines(logLine: string) {
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
          this.messages[this.linePointer] = chunk;
        } else {
          // append to the current line
          this.messages[this.linePointer] += chunk;
        }
        this.carriagePosition += chunk.length;
      }
    }
  }
}

class LogStageProcessor {
  public stages: IMNGS2CoreLogLine[][];  // log lines are grouped by section
  stagePointer: number;

  constructor() {
    this.stages = [[]];
    this.stagePointer = 0;
  }

  public lastMessage() {
    const messages = this.stages[this.stages.length - 1][0].messages
    return messages[messages.length - 1];
  }

  public hasProblems() {
    for (let stage of this.stages) {
      if (this.stageHasProblems(stage)) {
        return true;
      }
    }
    return false;
  }

  public stageHasProblems(stage: IMNGS2CoreLogLine[]) {
    for (let logLine of stage) {
      if (logLine.hasProblems()) {
        return true;
      }
    }
    return false;
  }

  private newStage() {
    this.stages.push([]);
    this.stagePointer++;
  }

  private addLogLine(log: IMNGS2CoreLogLine) {
    // check if the log line is a new stage
    if (log.messages[0].startsWith('#')) {
      this.newStage();
    }
    // add the log line to the current stage
    this.stages[this.stagePointer].push(log);
  }

  private addMessage(message: string) {
    // get last logLine or create a new one
    let logLine: IMNGS2CoreLogLine;
    if (this.stages[this.stagePointer].length === 0) {
      logLine = new IMNGS2CoreLogLine();
      this.stages[this.stagePointer].push(logLine);
    } else {
      logLine = this.stages[this.stagePointer][this.stages[this.stagePointer].length - 1];
    }
    logLine.addLines(message);
  }
}

let logHandlerFn: CallableFunction<LogSection, string> = processLogLine;
const preprocessingLogProcessors = ref<Map<string, LogStageProcessor>>({});
const mainLogProcessor = ref<LogStageProcessor>(new LogStageProcessor());
let lastLoggerName: string | null = null;
const PYTHON_LOGGER_REGEX = /(?<asctime>[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}) - (?<name>.*):(?<filename>.*):(?<lineno>[0-9]*) - (?<levelname>[A-Z]{4,5}) - (?<message>.*)/;

async function openDocumentationPreprocessing() {
  const url = "https://github.com/TUM-Core-Facility-Microbiome/IMNGS2-Core-docs/discussions/23";
  await indexBridge.openExternalLink(url);
}


onActivated(() => {
  console.log("IMNGS2-Core run activated. Triggering run.");
  state.autoScroll = true;
  getImngs2CoreBaseDirectory();
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

const state = reactive({
  baseDir: null as string | null,
  analysisDir: null as string | null,  // signal that pipeline is done and wrote to analysis dir
  autoScroll: true,
});

const emit = defineEmits(['update:isValid']);
watchEffect(() => {
  emit('update:isValid', state.analysisDir !== null && state.analysisDir !== '');
});

function getImngs2CoreBaseDirectory() {
  indexBridge.getImngs2CoreBaseDirectory().then((baseDir: string) => {
    console.log("Base dir: ", baseDir);
    state.baseDir = baseDir;
  }).catch(() => {
    console.log("Could not get base dir");
  });
}

function openAnalysisDirectory() {
  indexBridge.openImngs2CoreAnalysisDirectory();
}

function openExternal(url: string) {
  indexBridge.openExternalLink(url);
}

function processLogLine(section: LogSection, logMessage: string) {
  console.debug(`Log line: ${JSON.stringify(logMessage)}`);
  if (section === LogSection.CONTAINER_STREAM) {
    let m;
    if ((m = PYTHON_LOGGER_REGEX.exec(logMessage)) !== null) {  // regex matches; log line is first line in python logger
      // watch for the announcement of the analysis directory at the end of the analysis
      if (m.groups?.message.startsWith("Analysis done. Results directory: ")) {
        state.analysisDir = m.groups?.message.replace("Analysis done. Results directory: ", "");
        indexBridge.publishImngs2CoreAnalysisDirectory(state.analysisDir);
      }

      const loggerName = m.groups?.name;

      let logProcessor: LogStageProcessor;
      if (loggerName.startsWith('run_tactic.preprocessing.')) {  // preprocessing logger
        // add preprocessing logger if not present
        if (!preprocessingLogProcessors.value.hasOwnProperty(m.groups?.name)) {
          preprocessingLogProcessors.value[loggerName] = new LogStageProcessor();
        }
        lastLoggerName = loggerName;
        logProcessor = preprocessingLogProcessors.value[loggerName];
      } else {
        lastLoggerName = null;  // use the main logger
        logProcessor = mainLogProcessor.value;
      }

      const log = new IMNGS2CoreLogLine();
      log.name = m.groups?.name;
      log.filename = m.groups?.filename;
      log.lineno = parseInt(m.groups?.lineno);
      log.level = m.groups?.levelname;
      log.timestamp = m.groups?.asctime;
      log.addLines(m.groups?.message);

      logProcessor.addLogLine(log);
    } else {  // log line is a continuation of the previous log line
      let logProcessor: LogStageProcessor;
      console.log("Last logger name: " + lastLoggerName);
      if (lastLoggerName === null) {
        logProcessor = mainLogProcessor.value;  // use the main logger
      } else {
        logProcessor = preprocessingLogProcessors.value[lastLoggerName];
      }
      logProcessor.addMessage(logMessage);
    }
  } else {
    // add to main log
    const log = new IMNGS2CoreLogLine();
    log.addLines(logMessage);
    mainLogProcessor.value.addLogLine(log);
  }

  const terminal = document.getElementById("terminal");
  if (state.autoScroll && terminal !== null) {
    terminal.scrollTop = terminal.scrollHeight;
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
    indexBridge.terminateImngs2CoreBackend().finally(() => {
      resolve();
    });
    resolve();
  });
}

defineExpose({
  // no apply function, redirection is handled in wizardCompleted function on the wizard
  rollback,
});
</script>
