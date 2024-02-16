<template>
  <footer class="fixed bottom-0 bg-gray-800 w-full z-40 border-t transition-all">
    <div class="pl-16">
      <div class="justify-between pl-5 pr-5 w-full">
        <div>
          <div class="">
            <div class="text-xs text-white pt-5 pb-5">
              <span class="flex absolute h-3 w-3 pt-0.5">
                <span
                    class="absolute inline-flex h-full w-full rounded-full opacity-75"
                    :class="{
                      'bg-sky-400 animate-ping' : state.status === 'running',
                      'bg-green-400' : state.status === 'done',
                      'bg-gray-400' : state.status === 'idle',
                      'bg-red-400' : state.status === 'error',
                    }"
                ></span>
                <span
                    class="relative inline-flex rounded-full h-3 w-3"
                    :class="{
                      'bg-sky-500' : state.status === 'running',
                      'bg-green-500' : state.status === 'done',
                      'bg-gray-500' : state.status === 'idle',
                      'bg-red-500' : state.status === 'error',
                    }"
                ></span>
              </span>
              <div class="pl-7" v-if="state.status !== 'idle'">
                <span class="font-semibold">{{ state.step }}</span>:
                {{ state.progress }}
                <span v-if="state.error">
                  <a @click="openExternal(state.error.helpUrl)" class="underline cursor-pointer text-blue-500">Help page</a>
                </span>
              </div>
              <div class="pl-7" v-else>
                <span class="font-semibold">Idle</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import {reactive} from "vue";

const state = reactive({
  status: "idle", // "idle" | "running" | "done" | "error
  step: null,
  progress: null,
  error: null,
});

indexBridge.handleProgressUpdate((progress: Progress) => {
  console.log(`Progress: ${JSON.stringify(progress)}`);
  state.status = progress.state;
  state.step = progress.step;
  state.progress = progress.message;
  state.error = progress.error;
});

function openExternal(url: string) {
  // deep copy string

  indexBridge.openExternalLink(url);
}
</script>
