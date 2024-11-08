<template>
  <div>
    <div class="text-lg font-bold">Sample Browser</div>
    <div class="text-sm text-gray-700">
      Please select the samples you want to analyze. You can expand folders by clicking on the name.
    </div>
    <div class="bg-blue-100 border-t border-b border-blue-500 text-blue-700 px-2 py-1 mt-2 mb-2" role="alert">
      <span class="font-bold text-sm">Notice: </span>
      <span class="text-sm">Files are expected to follow a naming scheme listed
        <a @click="openDocumentationOnFileNaming()" class="underline cursor-pointer text-blue-500">here</a>
      </span>
    </div>
    <div class="bg-red-100 border-t border-b border-red-500 text-red-700 px-2 py-1 mt-2 mb-2" role="alert">
      <span class="font-bold text-sm">Warning:</span>
      <span class="text-sm">
        Only combine samples targeting the same region, i.e. the same primers were used.
      </span>
    </div>
  </div>
  <div>
    <StudyBrowser :base-dir="state.baseDir" @update:selectionChanged="onSelectionChanged($event)"/>
  </div>
</template>

<script setup lang="ts">
import StudyBrowser from "../../default/StudyBrowser.vue";
import {reactive, watchEffect} from "vue";

const state = reactive({
  baseDir: null as string | null,
  selectedItems: [] as IFileSystemNode[],
});

function onSelectionChanged(updated: IFileSystemNode[]) {
  console.log("Wrapper informed about changed selection");
  console.log(updated);
  state.selectedItems = updated;
}

const emit = defineEmits(['update:isValid']);
watchEffect(() => {
  emit('update:isValid', state.selectedItems.length > 0);
});

async function apply() {
  return new Promise<void>((resolve, reject) => {
    // as selected items are reactive this was causing issues (non-cloneable objects); a deep copy is a workaround
    const deepCopy = JSON.parse(JSON.stringify(state.selectedItems));
    indexBridge.publishSamples(deepCopy).then(() => {
      resolve();
    }).catch(() => {
      reject();
    });
  });
}

async function openDocumentationOnFileNaming() {
  const url = "https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz-docs/discussions/21";
  await indexBridge.openExternalLink(url);
}

defineExpose({
  apply,
});
</script>
