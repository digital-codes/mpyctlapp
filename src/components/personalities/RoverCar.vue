<template>
  <div class="rover-ctl">
    <div class="bgrid">
      <va-button v-for="button in buttons" :key="button.id" @click="handleClick(button)" :color="button.color"
        :class="button.double ? 'double-width' : ''">
        {{ button.label }}
      </va-button>
    </div>
    <div class="slgrid">
      <va-slider v-for="slider in sliders" :key="slider.id" v-model="slider.value" :min="slider.min" :max="slider.max"
        @change="handleSliderChange(slider.id, slider.value)" :label="slider.label" track-label-visible class="sld">
      </va-slider>
    </div>
    <div class="chgrid">
      <va-checkbox v-for="checkbox in checkboxes" :key="checkbox.id" v-model="checkbox.checked" class="mb-6"
        color="primary" checked-icon="fa-check" :label="checkbox.label"
        @update:modelValue="handleCheckboxChange(checkbox.id, checkbox.checked)">
      </va-checkbox>
    </div>

    <VaDataTable :items="sensdata" />

  </div>
</template>

<script setup>
import { ref } from "vue";
import { onMounted } from "vue";

import { getMotionCtl } from "../../services/motionCtl";
// pinia
import { useDeviceStore } from "../../stores/BleDevices";

const deviceStore = useDeviceStore()


// rover ctl is 7 bytes
const roverCtl = ref([0, 0, 0, 0, 1, 0, 0])
const roverSpeed = ref(0)
const roverBtn = ref(10) // stop button
const roverCheck = ref([0, 0])

onMounted(() => {
  console.log("Mounted");
  // buttons and checks are off by default. transmit default slider values only
  for (const item of sliders.value) {
    const id = item.id;
    const value = item.value;
    roverSpeed.value = parseInt(item.value)
  }
})

/*
# 2 pattern bits per motor
# fwd: 10, rev: 01, 00,11:stop 
patterns = OrderedDict([
    ("fwd", 0b10101010),
    ("rev", 0b01010101),
    ("left", 0b01 10 10 01),
    ("right", 0b10 01 01 10),
    ("lfwd", 0b00 10 10 00),
    ("rfwd", 0b10 00 00 10),
    ("lrev", 0b01 00 00 01),
    ("rrev", 0b00 01 01 00),
    ("lturn", 0b10 01 10 01),
    ("rturn", 0b01 10 01 10),
    ("stop", 0b00 00 00 00)
])
*/


const updateCar = () => {
  console.log("Updating car")
  console.log("Ctl data", roverCtl.value)
  const nMots = 4
  switch (roverBtn.value) {
    case 1:
      roverCtl.value[0] = - roverSpeed.value
      roverCtl.value[1] = roverSpeed.value
      roverCtl.value[2] = roverSpeed.value
      roverCtl.value[3] = - roverSpeed.value
      break
    case 2:
      for (let i = 0; i < nMots; i++)
        roverCtl.value[i] = roverSpeed.value
      break;
    case 3:
      for (let i = 0; i < nMots; i++)
        roverCtl.value[i] = -roverSpeed.value
      break
    case 4:
      roverCtl.value[0] = roverSpeed.value
      roverCtl.value[1] = - roverSpeed.value
      roverCtl.value[2] = - roverSpeed.value
      roverCtl.value[3] = roverSpeed.value
      break
    case 5:
      roverCtl.value[0] = 0
      roverCtl.value[1] = roverSpeed.value
      roverCtl.value[2] = roverSpeed.value
      roverCtl.value[3] = 0
      break
    case 6:
      roverCtl.value[0] = - roverSpeed.value
      roverCtl.value[1] = 0
      roverCtl.value[2] = 0
      roverCtl.value[3] = - roverSpeed.value
      break
    case 7:
      roverCtl.value[0] = 0
      roverCtl.value[1] = - roverSpeed.value
      roverCtl.value[2] = - roverSpeed.value
      roverCtl.value[3] = 0
      break
    case 8:
      roverCtl.value[0] = roverSpeed.value
      roverCtl.value[1] = 0
      roverCtl.value[2] = 0
      roverCtl.value[3] = roverSpeed.value
      break
    case 9:
      roverCtl.value[0] = roverSpeed.value
      roverCtl.value[1] = - roverSpeed.value
      roverCtl.value[2] = roverSpeed.value
      roverCtl.value[3] = - roverSpeed.value
      break
    case 10:
      for (let i = 0; i < nMots; i++)
        roverCtl.value[i] = 0
      break
    case 11:
      roverCtl.value[0] = - roverSpeed.value
      roverCtl.value[1] = roverSpeed.value
      roverCtl.value[2] = - roverSpeed.value
      roverCtl.value[3] = roverSpeed.value
      break
    default:
      for (let i = 0; i < nMots; i++)
        roverCtl.value[i] = 0
      break
  }
  deviceStore.setCtlData(roverCtl.value)
}

const buttons = ref([
  { id: 1, label: "Left", color: "primary" },
  { id: 2, label: "FWD", color: "primary" },
  { id: 3, label: "REV", color: "primary" },
  { id: 4, label: "Right", color: "primary" },
  { id: 5, label: "FWD Left", color: "primary" },
  { id: 6, label: "REV Left", color: "primary" },
  { id: 7, label: "REV Right", color: "primary" },
  { id: 8, label: "FWD Right", color: "primary" },
  { id: 9, label: "Rot Left", color: "primary" },
  { id: 10, label: "Stop", color: "warning", double: true },
  { id: 11, label: "Rot Right", color: "primary" },
]);

const sliders = ref([
  { id: 1, value: 5, min: 1, max: 10, label: "Speed" },
  //{ id: 2, value: 0, min: -1, max: 1, label: "Rotation" },
]);

const checkboxes = ref([
  { id: 1, checked: false, label: "Grip Left" },
  { id: 2, checked: false, label: "Grip Right" },
]);

const sensdata = ref([
  { label: "Temperature", value: 0 },
  { label: "Other", value: 10 }
])

const handleClick = (button) => {
  // Handle button click logic here
  console.log(`Button ${button.id} clicked`);
  roverBtn.value = parseInt(button.id)
  updateCar()
};

const handleSliderChange = (id, value) => {
  // Handle slider change logic here
  console.log(`Slider ${id} changed to ${value}`);
  roverSpeed.value = parseInt(value)
  updateCar()
};

const handleCheckboxChange = (id, checked) => {
  // Handle checkbox change logic here
  console.log(`Checkbox ${id} changed to ${checked}`);
  const checkOffset = 5
  roverCtl.value[checkOffset + parseInt(id) - 1] = checked ? 1 : 0
  console.log("check:", roverCtl.value)
  updateCar()
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
  /* buttons */
  margin-top: 2rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 10px;
}

.slgrid {
  /* sliders */
  margin-top: 2rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 10px;
}

.ckgrid {
  /* checkboxes */
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
  text-align: left;
  grid-column: span 1;
  margin: auto;
  padding: 1rem 1rem 0 1rem
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
