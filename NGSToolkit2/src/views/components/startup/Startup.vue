<template>
<!--  <p class="text-center">Running startup checks</p>-->
<!--  <p>Detected OS: {{ state.platform }}</p>-->
<!--  <p>Backend: {{ state.backendName }}</p>-->
<!--  <p>Backend Version: {{ state.backendVersion }}</p>-->

  <div class="max-h-40 overflow-y-auto border border-gray-300 rounded p-4">
    <div v-for="(message, index) in filteredMessages.reverse()" :key="index">
      <div v-if="index === 0" class="font-semibold">{{ message.step }}</div>
      <div v-if="message.step === currentStep" class="flex items-center ml-4">
        <div class="flex-grow">{{ message.message }}</div>
        <div v-if="index === filteredMessages.length - 1" class="font-semibold">
          <div class="px-3 py-1 text-xs font-medium leading-none text-center text-blue-800 bg-blue-200 rounded-full animate-pulse dark:bg-blue-900 dark:text-blue-200">
            running...
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
    <div
        class="bg-tic h-2.5 rounded-full"
        style="transition: width 1s ease-in;"
        :style="{width: `${state.pct}%`}"></div>
  </div>


<!--  <div ref="terminal" class="w-full h-full bg-black text-white p-4 font-mono overflow-y-auto">-->
<!--    <div v-for="(message, index) in messages" :key="index" class="flex">-->
<!--      <div class="mr-2">$</div>-->
<!--      <div class="flex-grow">{{ message.step }}</div>-->
<!--    </div>-->
<!--    <div v-for="(message, index) in messages" :key="index + messages.length" class="pl-6">{{ message.message }}</div>-->
<!--  </div>-->

<!--  {{ filteredMessages }}-->
<!--  <br><br>-->
<!--  {{ messages }}-->
<!--  <br><br>-->
<!--  {{ currentStep }}-->
</template>

<script setup lang="ts">
import {defineComponent, ref} from 'vue';
import {useRouter} from "vue-router";
import {reactive} from "vue";

const router = useRouter();

const state = reactive({
  platform: "unknown",
  backendName: "unknown",
  backendVersion: "loading",
  step: null,
  progress: null,
  pct: 0,
});

const messages = ref([]);

const currentStep = ref(null);

const filteredMessages = ref([]);

const updates: Progress[] = [];

indexBridge.initializeBackend().then(() => {
  console.log("Backend initialized");
  // router.push('/base-selection');  // TODO: uncomment
}).catch(() => {
  console.log("Backend initialization failed");
});

indexBridge.handleProgressUpdate((progress: Progress) => {
  // save update
  updates.push(progress);
});

const updateProgress = (update: Progress) => {
  const lastMessage = messages.value[messages.value.length - 1];
  messages.value.push(update);

  // Update current step
  currentStep.value = update.step;

  // Limit messages to 2 latest steps and 2 substeps for the latest step
  const stepCounts: { [step: string]: number } = {}; // Change type to string
  filteredMessages.value = messages.value.slice().reverse().filter(message => {
    if (message.step !== currentStep.value) {
      return false;
    }
    if (!stepCounts[message.step]) {
      stepCounts[message.step] = 0;
    }
    if (stepCounts[message.step] < 2) {
      stepCounts[message.step]++;
      return true;
    }
    return false;
  });

  console.log(stepCounts)

  // Scroll to bottom
  const messageBox = document.querySelector('.overflow-y-auto');
  messageBox.scrollTop = messageBox.scrollHeight;
};

// display updates but delay between each update
let i = 0;
setInterval(() => {
  if (i < updates.length) {
    const update = updates[i];
    state.step = update.step;
    state.progress = update.message;

    updateProgress(update);

    state.pct += 10;
    i++;
  }
}, 1000);
</script>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'Startup',
});
</script>
