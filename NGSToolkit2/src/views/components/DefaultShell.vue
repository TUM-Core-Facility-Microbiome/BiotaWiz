<template>
  <div>
    <div class="flex-grow">
      <div class="container left-16 m-3 relative mb-16">
        <router-view></router-view>
      </div>
    </div>
    <footer class="fixed bottom-0 bg-gray-800 py-4 w-full z-40 border-t">
      <div class="pl-16">
        <div class="justify-between pl-4 pr-4 w-full">
          <div>
            <div class="max-h-40 overflow-y-auto">
              <div v-for="(message, index) in filteredMessages.reverse()" :key="index">
                <div v-if="index === 0" class="text-sm text-white"><span class="font-semibold">{{ message.step }}</span>: {{ message.message }}</div>
                <div v-if="message.step === currentStep" class="flex items-center ml-4">
                  <div class="flex-grow"></div>
                </div>
              </div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700">
              <div
                  class="bg-tic h-1 rounded-full"
                  style="transition: width 1s ease-in;"
                  :style="{width: `${state.pct}%`}"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {reactive, ref} from "vue";

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
    if (stepCounts[message.step] < 1) {
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
