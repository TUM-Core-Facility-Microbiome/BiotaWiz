<template>
  <div class="container">
    <div class="flex-1 lg:max-w-2xl">
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-medium">Select TACTIC pipeline version</h3>
          <p class="text-sm text-muted-foreground">
            The environment holds the software that is used to run the TACTIC pipeline.
            <br>
            You can auto-update to the latest available and compatible version each time you start the pipeline or
            specify a version to always use to ensure reproducibility across runs.
          </p>
        </div>
        <div class="text-sm">
          latest version: {{ latest ?? (loadError ? 'unknown' : 'checking...') }}
        </div>
        <div v-if="loadError" role="alert" class="rounded border-s-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">
          Could not check for pipeline versions: {{ loadError }}
          <a @click="loadReleaseTags" class="underline cursor-pointer text-blue-500">Retry</a>
        </div>
        <div class="space-y-8">
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                   for="ImageTag">Update strategy</label>
            <select
                name="ImageTag"
                id="ImageTag"
                class="mt-1.5 w-full rounded-lg border-gray-300 text-gray-700 sm:text-sm"
                v-model="selectedTag"
            >
              <option :value="null">auto-update to latest version every run</option>
              <option v-for="option in compatibleTagStrings" :value="option" :key="option">always use version {{option}}</option>
            </select>
            <p id="ImageTag" class="text-xs text-muted-foreground">
              Using a different version of the pipeline might affect the results of the pipeline. You can pin a version
              to ensure reproducibility across runs.
            </p>
          </div>
        </div>
        <div>
          <!-- continue button on the right -->
          <div class="flex justify-end">
            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    @click="next">
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import {Environment} from "../../../enums";
import {useRouter} from "vue-router";

const compatibleTagStrings = ref([]);
const selectedTag = ref(null);
const associatedImages = ref([]);
const latest = ref(null);
const loadError = ref<string | null>(null);

const environment = Environment.TACTIC;

function loadFixedReleaseTag() {
  indexBridge.getFixedImageTagString(environment).then((tag: string) => {
    console.log('Got fixed tag', tag);
    // might be null if not fixed
    selectedTag.value = tag;
  });
}

function loadReleaseTags() {
  loadFixedReleaseTag();
  loadError.value = null;
  indexBridge.getCompatibleReleaseTagStrings(environment).then((tags: string[]) => {
    // reverse to get the latest release first
    tags.reverse();
    latest.value = tags[0];
    compatibleTagStrings.value = tags;
  }).catch((error: Error) => {
    console.error('Could not load pipeline versions', error);
    // remove the prefix Electron adds to errors of IPC calls
    loadError.value = String(error?.message ?? error).replace(/^Error invoking remote method '[^']*': (Error: )?/, '');
  });
}

loadReleaseTags();

// Watch for changes to selectedTag
watch(selectedTag, (newValue, oldValue) => {
  console.log('Selected value changed from', oldValue, 'to', newValue);
  // make sure it is a string or null
  if (typeof newValue !== 'string' && newValue !== null) {
    console.error('Invalid value for selectedTag', newValue);
    return;
  }
  let submitTag;
  if (newValue !== null) {
    submitTag = newValue.toString();
  } else {
    submitTag = null;
  }
  // inform the backend of the updated choice
  indexBridge.setFixedImageTagString(environment, submitTag).then(() => {
    loadReleaseTags();
  });
});

const router = useRouter();
async function next() {
  // navigate to the next step
  await router.push({name: 'tactic-wizard'});
}
</script>
