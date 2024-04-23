<template>
  <div class="cursor-pointer text-blue-700 text-sm select-none" @click="updateStudies">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Reset
    and reload
  </div>
  <div class="study-browser">
    <StudyBrowserElement :items="state.tree" @selection-changed="handleSelect"/>
  </div>
  <div class="text-sm" v-if="state.selectedItems.length > 0">Selected {{ state.selectedItems.length }} samples</div>
  <div class="text-sm" v-else>Please select at least one sample to continue</div>
</template>

<style scoped>
.study-browser {
  max-height: 350px;
  overflow-y: auto;
}
</style>

<script setup lang="ts">
import {reactive, watch, watchEffect} from "vue";
import {useRouter} from "vue-router";

const router = useRouter();

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
  // clear the selected items
  state.selectedItems = [];
  // load the studies
  indexBridge.loadStudiesFromBaseDirectory().then((studies: IFileSystemNode[]) => {
    console.log("Studies: ", studies);
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

const emit = defineEmits(['update:selectionChanged']);
watchEffect(() => {
  emit('update:selectionChanged', state.selectedItems);
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
