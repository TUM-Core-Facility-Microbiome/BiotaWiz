<template>
  <div>
    <div class="text-lg font-bold">Sample Browser</div>
    <div class="text-sm text-gray-700">
      Please select the samples you want to analyze. You can expand folders by clicking on the name.
    </div>
    <div class="bg-red-100 border-t border-b border-red-500 text-red-700 px-4 py-3 mt-2 mb-2" role="alert">
      <span class="font-bold text-sm">Notice:</span>
      <span class="text-xs">
        Only combine samples targeting the same region, i.e. the same primers were used.
      </span>
    </div>
  </div>
  <div>
    <StudyBrowser :base-dir="state.baseDir" @update:selectionChanged="onSelectionChanged($event)"/>
    <div class="bg-blue-100 border-t border-b border-blue-500 text-blue-700 px-4 py-3 mb-4 mt-10" role="alert">
      <p class="font-bold text-sm">Development notice:</p>
      <p class="text-xs">
        Currently, samples must follow the Illumina naming scheme and be paired to be detected.
        <br>
        A more flexible approach is planned for the final application (Issue #35).</p>
    </div>
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

defineExpose({
  apply,
});
</script>
