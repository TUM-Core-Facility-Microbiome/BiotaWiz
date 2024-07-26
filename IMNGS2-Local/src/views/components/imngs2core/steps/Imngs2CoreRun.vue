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
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" @click="openAnalysisDirectory">Open analysis directory</button>
      </div>
    </p>
  </div>
  <br>
<!--  <div class="p-4 text-xs font-mono bg-gray-800 text-white rounded-lg text-wrap w-100 max-h-80 min-h-80 overflow-y-auto"-->
<!--       id="terminal">-->
<!--    <p v-for="log of logLines" class="whitespace-pre-wrap">{{ log }}</p>-->
<!--  </div>-->

<!--  &lt;!&ndash; Accordion with the steps &ndash;&gt;-->
<!--  <div class="mt-4">-->
<!--    <div class="text-lg font-bold">Steps</div>-->
<!--    <div class="text-sm text-gray-700">-->
<!--      The pipeline consists of the following steps:-->
<!--    </div>-->
<!--    <div class="mt-2">-->
<!--      <div v-for="(step) of logsByStep">-->
<!--        <br>-->
<!--        <b>{{ step[0] }}</b>{{indicatesProblem(step[1]) ? " Problematic" : " OK"}}-->
<!--        <br>-->
<!--        <i v-for="logLine in step[1]">{{ logLine.timestamp }} - {{ logLine.level }} - {{ logLine.message }}<br></i>-->
<!--      </div>-->
<!--    </div>-->
<!--  </div>-->
  <div class="p-2 text-xs font-mono bg-gray-800 text-white rounded-lg text-wrap w-100 max-h-80 min-h-80 overflow-y-auto" id="terminal">
    <div class="space-y-2">
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
          <table>
            <tr v-for="line of step.messages">
              <td :class="{ 'text-orange-500': line.level == 'WARNING', 'text-red-500': line.level == 'CRITICAL' || line.level == 'ERROR' }">{{ line.message }}</td>
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
  message: string;
  timestamp: string | null;
  name: string | null;
  filename: string | null;
  lineno: number | null;

  constructor({level = null, message, timestamp = null, name = null, filename = null, lineno = null}: IMNGS2CoreLogLine) {
    this.level = level;
    this.message = message;
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
const logLines = ref<string[]>([]);

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

const regex = /(?<asctime>[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}) - (?<name>.*):(?<filename>.*):(?<lineno>[0-9]*) - (?<levelname>[A-Z]{4,5}) - (?<message>.*)/;

// save the logs by the step they are in as a hash map
const logsByStep = ref<IMNGS2CoreStep[]>([]);
let currentStep = "";

indexBridge.handleLogsForEnvironment((environment: Environment, logMessage: string) => {
  if (environment === Environment.IMNGS2CORE) {
    console.log(logMessage);

    let m;
    let message: IMNGS2CoreLogLine | null = null;
    if ((m = regex.exec(logMessage)) !== null) {  // regex matches; regular log line
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

      message = new IMNGS2CoreLogLine({
        level: m.groups?.levelname,
        message: m.groups?.message,
        timestamp: m.groups?.asctime,
        name: m.groups?.name,
        filename: m.groups?.filename,
        lineno: parseInt(m.groups?.lineno),
      });
      // logMessage = `${m.groups?.asctime} - ${m.groups?.levelname} - ${m.groups?.message}`;
    } else {
      console.log(`does not match: ${logMessage}`);
      message = new IMNGS2CoreLogLine({
        message: logMessage,
      });
    }

    if (logMessage.startsWith('\r')) {
      logLines.value.pop();
    }
    logLines.value.push(logMessage);
    // save message for current step
    if (currentStep) {
      const currentStep = logsByStep.value.length - 1;
      logsByStep.value[currentStep].messages.push(message);
    }
    const terminal = document.getElementById("terminal");
    terminal.scrollTop = terminal.scrollHeight;
    // Scroll to the bottom with a slight delay to ensure the DOM updates fully
    setTimeout(() => {
      terminal.scrollTop = terminal.scrollHeight;
    }, 50);
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
