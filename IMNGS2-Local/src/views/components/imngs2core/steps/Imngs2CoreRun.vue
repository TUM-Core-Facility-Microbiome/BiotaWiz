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

  <div class="p-2 text-xs font-mono bg-gray-800 text-white rounded-lg text-wrap w-100 max-h-80 min-h-80 overflow-y-auto" id="terminal">
    <div class="space-y-2">
      <div v-if="logsByStep.length == 0">Waiting for logs...</div>
      <details class="group [&_summary::-webkit-details-marker]:hidden" v-for="step of logsByStep" open>
        <summary class="flex cursor-pointer items-center justify-between gap-1.5 rounded-lg bg-gray-900 group-open:bg-gray-600 p-2 pl-3 text-white">
          <h2 class="font-medium group-open:font-bold">{{ step.name }}</h2>

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
            <tr v-for="line of step.messages">
              <td :class="{ 'text-orange-500': line.level == 'WARNING', 'text-red-500': line.level == 'CRITICAL' || line.level == 'ERROR' }" class="w-[300px] break-all overflow-hidden pb-2">
                <div v-for="m of line.messages">{{ m }}</div>
              </td>
            </tr>
          </table>
        </p>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref, reactive} from "vue";
import {Environment} from "../../../../enums";

class IMNGS2CoreLogLine {
  level: string | null;
  messages: string[];
  timestamp: string | null;
  name: string | null;
  filename: string | null;
  lineno: number | null;

  constructor({level = null, messages, timestamp = null, name = null, filename = null, lineno = null}: IMNGS2CoreLogLine) {
    this.level = level;
    this.messages = messages;
    this.timestamp = timestamp;
    this.name = name;
    this.filename = filename;
    this.lineno = lineno;
  }
}

class IMNGS2CoreStep {
  name: string;
  messages: IMNGS2CoreLogLine[];

  constructor({name, messages}: IMNGS2CoreStep) {
    this.name = name;
    this.messages = messages;
  }
}

const state = reactive({
  baseDir: null as string | null,
  analysisDir: null as string | null,
});

onMounted(() => {
  getImngs2CoreBaseDirectory();
  // prepare the environment
  indexBridge.runImngs2Core().then(() => {
    console.log("IMNGS2-Core running");
  }).catch(() => {
    console.log("IMNGS2-Core pipeline failed");
  });
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

function showSpecialChars(str) {
  return str.replace(/[\x00-\x1F\x7F-\x9F]/g, function(c) {
    return '\\x' + ('0' + c.charCodeAt(0).toString(16)).slice(-2);
  });
}

const regex = /(?<asctime>[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}) - (?<name>.*):(?<filename>.*):(?<lineno>[0-9]*) - (?<levelname>[A-Z]{4,5}) - (?<message>.*)/;

// save the logs by the step they are in as a hash map
const logsByStep = ref<IMNGS2CoreStep[]>([]);
let currentStep = "";
let lastMessage = null;

const ansiEscapeSequencePattern = /\x1b\[[0-9;]*[mKA]/g;

indexBridge.handleLogsForEnvironment((environment: Environment, logMessage: string) => {
  if (environment === Environment.IMNGS2CORE) {
    console.log(logMessage);

    let m;
    let message: IMNGS2CoreLogLine | null = null;
    if ((m = regex.exec(logMessage)) !== null) {  // regex matches; regular log line
      // watch for the announcement of the analysis directory at the end of the analysis
      if (m.groups?.message.startsWith("Analysis done. Results directory: ")) {
        state.analysisDir = m.groups?.message.replace("Analysis done. Results directory: ", "");
        indexBridge.publishImngs2CoreAnalysisDirectory(state.analysisDir);
      }

      // hash symbol at the start of the message indicates a new step
      if (m.groups?.message.startsWith("# ")) {
        const step = m.groups?.message.replace("# ", "");
        logsByStep.value.push(new IMNGS2CoreStep({
          name: step,
          messages: [],
        }));
        currentStep = step;
        return;
      }

      let msgs = [];
      let currentLine = '';
      for (const char of m.groups?.message) {
        if (char === '\x0D' || char === '\x0d') {
          // Carriage Return (CR): reset the current line (but don't add to lines yet)
          if (currentLine.trim().length > 0) {
            msgs.push(currentLine);
          }
          currentLine = '';
        } else if (char === '\x0A' || char === '\x0a') {
          // Line Feed (LF): finalize the current line and start a new one
          if (currentLine.trim().length > 0) {
            msgs.push(currentLine);
          }
          currentLine = '';
        } else {
          // Append characters to the current line, ignoring ANSI escape sequences
          currentLine += char.replace(ansiEscapeSequencePattern, '');
        }
      }
      // finalize current line
      if (currentLine.trim().length > 0) {
        msgs.push(currentLine);
      }

      message = new IMNGS2CoreLogLine({
        level: m.groups?.levelname,
        messages: msgs,
        timestamp: m.groups?.asctime,
        name: m.groups?.name,
        filename: m.groups?.filename,
        lineno: parseInt(m.groups?.lineno),
      });

      const currentStep = logsByStep.value.length - 1;
      logsByStep.value[currentStep].messages.push(message);

      lastMessage = message;

      console.log(`matches: ${showSpecialChars(m.groups?.message)}`)
      // logMessage = `${m.groups?.asctime} - ${m.groups?.levelname} - ${m.groups?.message}`;
    } else {
      // the python logger format is not found at the start of the message
      // this means this is a continuation of the previous message
      console.log(`does not match: ${showSpecialChars(logMessage)}`);

      let msgs = [];
      let currentLine = '';
      for (const char of logMessage) {
        if (char === '\x0D' || char === '\x0d') {
          // Carriage Return (CR): reset the current line (but don't add to lines yet)
          if (currentLine.trim().length > 0) {
            msgs.push(currentLine);
          }
          currentLine = '';
        } else if (char === '\x0A' || char === '\x0a') {
          // Line Feed (LF): finalize the current line and start a new one
          if (currentLine.trim().length > 0) {
            msgs.push(currentLine);
          }
          currentLine = '';
        } else {
          // Append characters to the current line, ignoring ANSI escape sequences
          currentLine += char.replace(ansiEscapeSequencePattern, '');
        }
      }
      // finalize current line
      if (currentLine.trim().length > 0) {
        msgs.push(currentLine);
      }

      if (!lastMessage) {
        // new LogLine
        message = new IMNGS2CoreLogLine({
          messages: msgs,
        });

        const currentStep = logsByStep.value.length - 1;
        logsByStep.value[currentStep].messages.push(message);
      } else {
        // add string array to previous string array
        lastMessage.messages.push(...msgs);
      }
    }

    const terminal = document.getElementById("terminal");
    terminal.scrollTop = terminal.scrollHeight;
    // // Scroll to the bottom with a slight delay to ensure the DOM updates fully
    // setTimeout(() => {
    //   terminal.scrollTop = terminal.scrollHeight;
    // }, 50);
  }
});

function indicatesProblem(messages: IMNGS2CoreLogLine[]) {
  return messages.some((message) => message.level === "ERROR" || message.level === "CRITICAL" || message.level === "WARNING");
}

async function rollback() {
  return new Promise<void>(async (resolve, reject) => {
    await indexBridge.terminateImngs2CoreBackend();
  });
}

defineExpose({
  rollback,
});
</script>
