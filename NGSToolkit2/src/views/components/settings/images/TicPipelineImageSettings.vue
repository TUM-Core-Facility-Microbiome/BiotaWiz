<template>
  <div class="container">
    <div>
      <label for="ImageTag" class="block text-sm font-medium text-gray-900">Image Tag</label>

      <select
          name="ImageTag"
          id="ImageTag"
          class="mt-1.5 w-full rounded-lg border-gray-300 text-gray-700 sm:text-sm"
          v-model="selectedTag"
      >
        <option :value="null">use latest compatible release</option>
        <option v-for="option in compatibleTagStrings" :value="option" :key="option">{{ option }}</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'

const compatibleTagStrings = ref([]);
const selectedTag = ref(null);

function loadFixedReleaseTag() {
  indexBridge.getFixedImageTagString().then((tag: string) => {
    console.log('Got fixed tag', tag);
    // might be null if not fixed
    selectedTag.value = tag;
  });
}

function loadReleaseTags() {
  loadFixedReleaseTag();
  indexBridge.getCompatibleReleaseTagStrings().then((tags: string[]) => {
    // reverse to get the latest release first
    tags.reverse();
    compatibleTagStrings.value = tags;
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
  indexBridge.setFixedImageTagString(submitTag).then(() => {
    loadReleaseTags();
  });
});

</script>