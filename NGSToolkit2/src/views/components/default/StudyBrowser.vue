<template>
  <button class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded" @click="updateStudies">Reload</button>
  <p>Selected files: {{ state.selectedItems.length }}</p>
  <div class="study-browser">
    <StudyBrowserElement :items="state.tree" @selection-changed="handleSelect" />
  </div>
  <button @click="publishSelectedSamples()">Apply</button>
</template>

<style scoped>
.study-browser {
  max-height: 350px;
  overflow-y: auto;
}
</style>

<script setup lang="ts">
import {reactive, watch} from "vue";

const props = defineProps({
  baseDir: {
    type: String,
    required: true,
  },
});

const state = reactive({
  tree: [] as IFileSystemNode[],
  selectedItems: [] as IFileSystemNode[],
});

const updateStudies = () => {
  indexBridge.loadStudiesFromBaseDirectory().then((studies: IFileSystemNode[]) => {
    console.log("Studies: " , studies);
    state.tree = studies;
  }).catch(() => {
    console.log("Could not load studies");
  });
}

// load studies on startup
updateStudies();

// on change of baseDir prop
watch(() => props.baseDir, () => {
  updateStudies();
});

const handleSelect = (selectedItems: any[]) => {
  state.selectedItems = selectedItems;
  console.log(`selectedItems: ${JSON.stringify(selectedItems)}`);
  // remove studies from the selected items
  const files = selectedItems.filter((item) => item.type !== 'study');
  console.log(`files: ${JSON.stringify(files)}`)
  // get the name of the selected files
  const fileNames = files.map((file) => file.name);
  console.log(`fileNames: ${fileNames}`);
}

async function publishSelectedSamples() {
  // as selected items are reactive this was causing issues (non-cloneable objects); a deep copy is a workaround
  const deepCopy = JSON.parse(JSON.stringify(state.selectedItems));
  await indexBridge.publishSamples(deepCopy);
}
</script>

<script lang="ts">
import StudyBrowserElement from './StudyBrowserElement.vue';

export default {
  name: 'StudyBrowser',
  components: {
    StudyBrowserElement,
  },
};
</script>
