<template>
  <div class="rover-ctl">
    <div class="bgrid">
      <va-button v-for="button in buttons" :key="button.id" @click="handleClick(button)" :color="button.color"
        :class="button.double ? 'double-width' : ''">
        {{ button.label }}
      </va-button>
    </div>
    <div class="sgrid">
      <va-slider v-for="slider in sliders" :key="slider.id" v-model="slider.value" :min="slider.min" :max="slider.max"
        @change="handleSliderChange(slider.id, slider.value)" :label="slider.label" track-label-visible class="sld">
      </va-slider>
    </div>
    <div class="sgrid">
      <va-checkbox v-for="checkbox in checkboxes" :key="checkbox.id" v-model="checkbox.checked" class="mb-6"
        color="primary" checked-icon="fa-check" :label="checkbox.label"
        @update:modelValue="handleCheckboxChange(checkbox.id, checkbox.checked)">
      </va-checkbox>

      <div v-for="gauge in gauges" :key="gauge.id" class="gauge">
        <SimpleGauge :value="gauge.value" :max="100" :label="gauge.label" :color="gauge.color">{{ gauge.type }}</SimpleGauge>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { onMounted } from "vue";

import SimpleGauge from "../charts/SimpleGauge.vue";



onMounted(() => {
  console.log("Mounted");
  // buttons and checks are off by default. trnasmit default slider values only
  for (const item of sliders.value) {
    const id = item.id;
    const value = item.value;
    emit("slider-change", { id, value })
  }
})

const emit = defineEmits(["button-click", "slider-change", "checkbox-change"]);

const buttons = ref([
  { id: 1, label: "FFWD", color: "primary" },
  { id: 2, label: "FWD", color: "primary" },
  { id: 3, label: "REV", color: "primary" },
  { id: 4, label: "FREV", color: "primary" },
  { id: 5, label: "Rot Left", color: "primary" },
  { id: 6, label: "Stop", color: "warning", double: true },
  { id: 7, label: "Rot Right", color: "primary" },
]);

const sliders = ref([
  { id: 1, value: 0, min: -5, max: 5, label: "LTrim" },
  { id: 2, value: 0, min: -5, max: 5, label: "RTrim" },
]);

const checkboxes = ref([
  { id: 1, checked: false, label: "Lift" },
  { id: 2, checked: false, label: "Grip" },
]);

const gauges = ref([
  { id: 1, type: "rot", label: "Rot" },
  { id: 2, type: "acc", label: "Acc" },
]);

const handleClick = (button) => {
  // Handle button click logic here
  console.log(`Button ${button.id} clicked`);
  emit("button-click", button.id);
};

const handleSliderChange = (id, value) => {
  // Handle slider change logic here
  console.log(`Slider ${id} changed to ${value}`);
  emit("slider-change", { id, value });
};

const handleCheckboxChange = (id, checked) => {
  // Handle checkbox change logic here
  console.log(`Checkbox ${id} changed to ${checked}`);
  emit("checkbox-change", { id, checked });
};
</script>

<style scoped>
.rover-ctl {
  max-width: 600px;
  margin-top: 1rem;
  margin-bottom: 1rem;
  margin-left: auto;
  margin-right: auto;
  padding: 1rem;
}

.bgrid {
  margin-top: 2rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 10px;
}

.sgrid {
  margin-top: 2rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 10px;
}

.double-width {
  grid-column: span 2;
  /* Makes the item span two columns */
}

button {
  width: 100%;
  height: 6rem;
}

.va-slider {
  grid-column: span 2;
}

.va-checkbox {
  text-align: center;
  grid-column: span 1;
  margin: auto
}

.gauge {
  grid-column: span 1;
  width: 100%;
  height: 100%;
  text-align: center;
  grid-column: span 1;
  margin: auto
}


@media (max-width: 500px) {
  button {
    height: 4rem;
  }
}
</style>

<style>
.sld .va-input__label {
  margin-right: 1rem;
  width: 10%;
  text-align: left;
}

@media (max-width: 500px) {
  .sld .va-input__label {
    width: 20%;
    text-align: center;
  }
}
</style>
