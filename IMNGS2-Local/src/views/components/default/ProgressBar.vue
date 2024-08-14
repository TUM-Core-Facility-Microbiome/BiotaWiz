<template>
  <footer class="fixed bottom-0 bg-gray-800 w-full z-40 border-t transition-all">
    <div class="pl-16">
      <div class="justify-between px-3 w-full">
        <div>
          <div class="">
            <div class="pt-4 pb-4">
              <div class="inline-flex rounded-xl pr-2.5 py-1 text-xs font-medium text-white bg-gray-600 font-semibold">
                <span class="flex absolute h-3 w-3 ml-1.5 mt-0.5">
                  <span
                      class="absolute inline-flex h-full w-full rounded-full opacity-75"
                      :class="{
                        'bg-sky-400 animate-ping' : state.status === 'running',
                        'bg-green-400' : state.status === 'done',
                        'bg-gray-400' : state.status === 'idle',
                        'bg-red-400' : state.status === 'error',
                        'bg-orange-400' : state.status === 'warning',
                      }"
                  />
                  <span
                      class="relative inline-flex rounded-full h-3 w-3"
                      :class="{
                        'bg-sky-500' : state.status === 'running',
                        'bg-green-500' : state.status === 'done',
                        'bg-gray-500' : state.status === 'idle',
                        'bg-red-500' : state.status === 'error',
                        'bg-orange-500' : state.status === 'warning',
                      }"
                  />
                </span>
                <span class="pl-6" v-if="state.environment.name">
                  {{ state.environment.name }} {{ state.environment.tag }}
                </span>
                <span class="pl-6" v-else>
                  Idle
                </span>
              </div>
              <div class="inline-flex pl-2.5 text-xs text-white" v-if="state.status !== 'idle'">
                <span class="font-semibold">{{ state.step }}</span>:
                {{ state.progress }}&nbsp;
                <span v-if="state.error">
                  <a @click="openExternal(state.error.helpUrl)"
                     class="underline cursor-pointer text-blue-500">Help page</a>
                </span>
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
import {Environment} from "../../../enums";

const state = reactive({
  status: "idle", // "idle" | "running" | "done" | "warning" | "error
  step: null,
  progress: null,
  error: null,
  environment: {
    name: null as Environment | null,
    tag: "",
  },
});

indexBridge.handleProgressUpdate((progress: Progress) => {
  console.log(`Progress: ${JSON.stringify(progress)}`);
  state.status = progress.state;
  state.step = progress.step;
  state.progress = progress.message;
  state.error = progress.error;
});

indexBridge.handleEnvChange((environment: Environment | null, version: string) => {
  state.environment = {
    name: environment,
    tag: version,
  };
  state.status = "idle";
  state.step = null;
  state.progress = null;
  state.error = null;
});

function openExternal(url: string) {
  // deep copy string

  indexBridge.openExternalLink(url);
}
</script>
