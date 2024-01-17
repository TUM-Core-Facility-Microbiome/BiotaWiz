<template>
  <ul>
    <li v-for="(item, index) in items" :key="index">
      <div @click="toggleCollapse(item)">
        <span :class="{ 'font-bold': item.expanded }">
          <div class="flex cursor-pointer mt-1" @mousedown.prevent>
            <input
                type="checkbox"
                v-if="item.type === 'directory'"
                :indeterminate="isIndeterminate(item)"
                v-model="item.selected"
                class="mr-2 cursor-pointer"
                @click.stop
                @change="handleCheckboxChange(item)"
            />
            <input
                type="checkbox"
                v-else
                v-model="item.selected"
                class="mr-2 cursor-pointer"
                @click.stop
                @change="handleCheckboxChange(item)"
            />
            <template v-if="item.type === 'directory' && !item.expanded">
              <FolderIcon class="h-6 w-6 text-blue-500 mr-1"/>
            </template>
            <template v-else-if="item.type === 'directory' && item.expanded">
              <FolderOpenIcon class="h-6 w-6 text-blue-500  mr-1"/>
            </template>
            <template v-else>
              <DocumentIcon class="h-6 w-6 text-blue-500 mr-1"/>
            </template>
            <p class="font-mono">{{ item.name }} {{ item.isCompressed }} {{ item.isPaired }}</p>
          </div>
        </span>
      </div>
      <StudyBrowserElement v-if="item.expanded && item.type === 'directory'" :items="item.children" @selection-changed="selectItem"/>
    </li>
  </ul>
</template>

<style scoped>
/* Add custom styles here */
ul {
  list-style-type: none;
  padding-left: 1.7rem;
}

ul:first-child {
  padding-left: 0rem;
}

li {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>

<script setup>
import {defineProps, defineEmits} from 'vue'
import {FolderIcon, FolderOpenIcon, DocumentIcon} from '@heroicons/vue/24/outline'

const props = defineProps(['items']); // Define the 'items' prop
const emit = defineEmits(['selection-changed']);

const handleCheckboxChange = (node) => {
  console.log('Checkbox changed', node.name, node.selected);
  if (node.children) {
    // If the node has children, propagate the checkbox state to its children
    // the selection state is inverted as the checkbox state is already set before this function is called
    propagateCheckboxState(node, !node.selected);
  }

  // Emit the selection-changed event
  const selectedItems = getSelectedItems();
  emit('selection-changed', selectedItems);
};

const propagateCheckboxState = (node, state) => {
  const setCheckboxState = (item) => {
    if (item.children) {
      item.children.forEach(setCheckboxState);
    }

    item.selected = state;
  };

  node.children.forEach(setCheckboxState);
};

const isIndeterminate = (node) => {
  if (!node.children || node.children.length === 0) {
    // If the node has no children, it can't be indeterminate
    return false;
  }

  const selectedCount = node.children.filter(item => item.selected).length;

  if (selectedCount === 0) {
    // If none of the children are selected, it can't be indeterminate
    node.selected = false;
    return false;
  } else if (selectedCount === node.children.length) {
    // If all children are selected, it can't be indeterminate
    node.selected = true;
    return false;
  } else {
    // If some of the children are selected, it's indeterminate
    return true;
  }
};

const toggleCollapse = (item) => {
  if (item.children) {
    item.expanded = !item.expanded;
  }
}

const selectItem = (item) => {
  if (item.children) {
    toggleCollapse(item);
  }

  emit('selection-changed', getSelectedItems());
}

const getSelectedItems = () => {
  const selectedItems = [];
  collectSelectedItems(props.items, selectedItems);
  return selectedItems;
}

const collectSelectedItems = (items, selectedItems) => {
  for (const item of items) {
    if (item.children) {
      collectSelectedItems(item.children, selectedItems);
    } else if (item.selected) {
      selectedItems.push(item);
    }
  }
}
</script>
