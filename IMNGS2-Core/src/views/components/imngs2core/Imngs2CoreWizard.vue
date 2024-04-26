<template>
  <!-- imngs2core Pipeline Wizard -->
  <div>
    <Wizard
        :nextButton="nextButtonOptions"
        :backButton="backButtonOptions"
        :doneButton="doneButtonOptions"
        :custom-tabs="[
          {
            title: 'Base',
          },
          {
            title: 'Samples',
          },
          {
            title: 'Spike-in',
          },
          {
            title: 'Parameters',
          },
          {
            title: 'USEARCH',
          },
          {
            title: 'Run',
          },
        ]"
        :beforeChange="onTabBeforeChange"
        @change="onChangeCurrentTab"
        @complete:wizard="wizardCompleted"
    >
      <h5 v-if="currentTabIndex === 0">
        <BaseSelection ref="step-0" @update:isValid="isChildValid = $event" />
      </h5>
      <h5 v-if="currentTabIndex === 1">
        <StudySelection ref="step-1" @update:isValid="isChildValid = $event"/>
      </h5>
      <h5 v-if="currentTabIndex === 2">
        <SpikeMode ref="step-2" @update:isValid="isChildValid = $event" />
      </h5>
      <h5 v-if="currentTabIndex === 3">
        <Parameters ref="step-3" @update:isValid="isChildValid = $event" />
      </h5>
      <h5 v-if="currentTabIndex === 4">
        <Usearch ref="step-4" @update:isValid="isChildValid = $event" />
      </h5>
      <h5 v-if="currentTabIndex === 5">
        <Run ref="step-5" @update:isValid="isChildValid = $event" />
      </h5>
    </Wizard>
  </div>
  <!-- TIC Pipeline Wizard End -->
</template>

<script setup lang="ts">
import {onMounted} from "vue";
import {Environment} from "../../../enums";

onMounted(() => {
  // prepare the environment
  indexBridge.initializeEnvironment(Environment.IMNGS2CORE).then(() => {
    console.log("Backend initialized 2");
  }).catch(() => {
    console.log("Backend initialization failed");
  });
});
</script>

<script lang="ts">
//import 'form-wizard-vue3/dist/form-wizard-vue3.css';
import Wizard from 'form-wizard-vue3';
import BaseSelection from "./steps/BaseSelection.vue";
import StudySelection from "./steps/StudySelection.vue";
import SpikeMode from "./steps/SpikeMode.vue";
import Parameters from "./steps/Parameters.vue";
import Usearch from "./steps/Usearch.vue";
import Run from "./steps/Imngs2CoreRun.vue";

export default {
  name: 'TicPipelineWizard',
  components: {
    Wizard,
    BaseSelection,
    StudySelection,
    SpikeMode,
    Parameters,
    Usearch,
    Run,
  },
  data() {
    return {
      currentTabIndex: 0,
      isChildValid: false,
    };
  },
  methods: {
    async onChangeCurrentTab(index: number, oldIndex: number) {
      return new Promise<boolean>((resolve, reject) => {
        if (index > oldIndex + 1) {
          console.log('You can not skip tabs');
          this.currentTabIndex = oldIndex;
          reject(false);
        }
        if (oldIndex >= 0) {
         if (index == oldIndex + 1) {  // next
            this.$refs[`step-${oldIndex}`].apply().then(() => {
              this.currentTabIndex = index;
              resolve(true);
            }).catch(() => {
              this.currentTabIndex = oldIndex;
              reject(false);
            });
          } else {  // back
           this.$refs[`step-${oldIndex}`].rollback().then(() => {
             resolve(true);
           }).catch(() => {
             reject(false);
           });
          }
        } else {
          this.currentTabIndex = index;
          resolve(true);
        }
      });
    },
    onTabBeforeChange() {
    },
    wizardCompleted() {
      console.log('Wizard Completed');
    },
  },
  computed: {
    nextButtonOptions() {
      if (this.currentTabIndex === 5) {
        return {
          hidden: true,
        };
      } else {
        return {
          text: 'next',
          disabled: !this.isChildValid,
        };
      }
    },
    backButtonOptions() {
      if (this.currentTabIndex === 5) {
        return {
          text: 'Stop processing and go back'
        };
      } else {
        return {
          text: 'back',
        };
      }
    },
    doneButtonOptions() {
        return {
          disabled: true,
        };
    },
  },
};
</script>

<style>
.fw-card {
  background: #ffffff;
  border: 1px solid #eff0f7;
  box-shadow: 0 5px 16px #080f340f;
  border-radius: 10px
}

.form-wizard-vue {
  display: flex;
  flex-direction: column
}

.form-wizard-vue .fw-body-list {
  position: relative;
  text-align: center;
  display: flex;
  overflow: hidden;
  list-style-type: none !important
}

.form-wizard-vue .fw-body-list li {
  position: relative;
  padding: 0 0.5rem 0.5rem;
}

.form-wizard-vue .fw-body-list li .fw-list-wrapper-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem; /* 12px */
  line-height: 1rem; /* 16px */
  font-weight: 700;
  text-align: center;
  --tw-bg-opacity: 1;
  background-color: rgb(249 250 251 / var(--tw-bg-opacity));
  --tw-text-opacity: 1;
  color: rgb(75 85 99 / var(--tw-text-opacity));
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
}

.fw-step-title {
  font-size: 0.75rem; /* 12px */
  line-height: 1rem; /* 16px */
  font-weight: 700;
}

.form-wizard-vue .fw-body-list li .fw-squared-tab {
  border-radius: .4rem
}

.form-wizard-vue .fw-body-list .fw-list-progress {
  position: absolute;
  width: 40%;
  height: 2px;
  background: #eff0f7;
  top: 40%;
  left: 80%
}

.form-wizard-vue .fw-body-list .fw-list-progress-active {
  background: rgb(37 99 235 / 1)
}

.form-wizard-vue .fw-body-list li:last-child .fw-list-progress {
  width: 0%
}

.form-wizard-vue .fw-body-list li, .form-wizard-vue .fw-body-list .fw-list-wrapper {
  flex: 1;
  align-items: center;
  flex-wrap: wrap;
  flex-grow: 1
}

.form-wizard-vue .fw-body-list .fw-list-wrapper {
  display: flex
}

.form-wizard-vue .fw-body-list > li > .fw-list-wrapper {
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0 auto;
  color: #6f6c90;
  position: relative;
  top: 3px
}

.form-wizard-vue .fw-step-active {
  --tw-text-opacity: 1;
  background: rgb(37 99 235 / var(--tw-text-opacity)) !important;
  color: #fff !important
}

.form-wizard-vue .fw-step-checked {
  --tw-text-opacity: 1;
  border: 2px solid rgb(37 99 235 / var(--tw-text-opacity));
}

.form-wizard-vue .fw-footer {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
}

.fw-btn {
  display: flex;
  align-items: center;
  background-color: transparent;
  font-weight: 600;
  --tw-text-opacity: 1;
  color: rgb(29 78 216 / var(--tw-text-opacity));
  cursor: pointer;
  padding: 0.25rem 1rem;
  border-width: 1px;
  border-radius: 0.25rem;
  --tw-border-opacity: 1;
  border-color: rgb(59 130 246 / var(--tw-border-opacity));
  text-align: center;
}

.fw-btn:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(59 130 246 / var(--tw-bg-opacity));
  --tw-text-opacity: 1;
  color: rgb(255 255 255 / var(--tw-text-opacity));
}

.fw-btn span {
  margin-right: 3px
}

.fw-btn-disabled {
  opacity: .5;
  cursor: not-allowed
}
</style>
