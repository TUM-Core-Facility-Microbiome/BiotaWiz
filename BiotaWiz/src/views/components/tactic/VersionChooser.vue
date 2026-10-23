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
          <template v-if="loadError && installedTagStrings.length > 0">latest installed version: {{ newestStableInstalled ?? installedTagStrings[0] }}</template>
          <template v-else>latest version: {{ latest ?? (loadError ? 'unknown' : 'checking...') }}</template>
        </div>
        <div v-if="loadError && installedTagStrings.length > 0" role="alert"
             class="rounded border-s-4 border-yellow-500 bg-yellow-100 p-3 text-sm text-yellow-800">
          Could not check for new pipeline versions online: {{ loadError }}
          <br>
          You can continue offline with an installed version: <strong>{{ installedTagStrings.map((tag) => `v${tag}`).join(', ') }}</strong>.
          <template v-if="newestStableInstalled">Auto-update will use the newest installed version, v{{ newestStableInstalled }}.</template>
          <a @click="loadReleaseTags" class="underline cursor-pointer text-blue-500">Retry</a>
        </div>
        <div v-else-if="loadError" role="alert" class="rounded border-s-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">
          Could not check for pipeline versions: {{ loadError }}
          <br>
          No pipeline version is installed yet, so internet access is needed to download one.
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
              <option v-for="option in versionOptions" :value="option" :key="option">
                always use version {{ option }}{{ isPrerelease(option) ? ' (release candidate)' : '' }}{{ installedTagStrings.includes(option) ? ' (installed)' : (loadError ? ' (not installed)' : '') }}
              </option>
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
import {computed, ref, watch} from 'vue'
import {Environment} from "../../../enums";
import {useRouter} from "vue-router";

const compatibleTagStrings = ref<string[]>([]);
const installedTagStrings = ref<string[]>([]);  // usable without internet access, newest first
const selectedTag = ref(null);
const associatedImages = ref([]);
const latest = ref(null);
const loadError = ref<string | null>(null);

// auto-update falls back to the newest installed stable release
const newestStableInstalled = computed(() => installedTagStrings.value.find((tag) => !isPrerelease(tag)) ?? null);

// versions to pin: those available online, or the installed ones if the online check failed
const versionOptions = computed(() => {
  const options = loadError.value ? [...installedTagStrings.value] : [...compatibleTagStrings.value];
  // keep showing a pinned version that is not in the list
  if (typeof selectedTag.value === 'string' && !options.includes(selectedTag.value)) {
    options.unshift(selectedTag.value);
  }
  return options;
});

const environment = Environment.TACTIC;

// versions like 1.0.2-rc.1 are pre-releases
function isPrerelease(version: string) {
  return version.includes('-');
}

function loadFixedReleaseTag() {
  indexBridge.getFixedImageTagString(environment).then((tag: string) => {
    console.log('Got fixed tag', tag);
    // might be null if not fixed
    selectedTag.value = tag;
  });
}

function loadInstalledReleaseTags() {
  indexBridge.getInstalledReleaseTagStrings(environment).then((tags: string[]) => {
    installedTagStrings.value = tags.reverse();  // newest first
  }).catch((error: Error) => {
    console.error('Could not list installed pipeline versions', error);
  });
}

function loadReleaseTags() {
  loadFixedReleaseTag();
  loadInstalledReleaseTags();
  loadError.value = null;
  indexBridge.getCompatibleReleaseTagStrings(environment).then((tags: string[]) => {
    // reverse to get the latest release first
    tags.reverse();
    // auto-update uses the latest stable release, also when release candidates are shown
    latest.value = tags.find((tag) => !isPrerelease(tag)) ?? null;
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
