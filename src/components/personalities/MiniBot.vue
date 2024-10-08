<template>
  <div class="rover-ctl">
    <div class="type">
      <va-switch
        v-model="botWheels"
        color="primary"
        true-inner-label="4"
        false-inner-label="2"
        label="2/4 Wheels"
        leftLabel="true"
        size="medium"
        @input="wheelChange"
      >
      </va-switch>
    </div>
    <div class="type">
      <va-switch
        v-model="botScale"
        color="primary"
        true-inner-label="2"
        false-inner-label="1"
        label="Speed Scale"
        leftLabel="true"
        size="medium"
        @input="scaleChange"
      >
      </va-switch>
    </div>
    <div class="bgrid">
      <va-button
        v-for="button in buttons"
        :key="button.id"
        @click="handleClick(button)"
        :color="button.color"
        :class="button.double ? 'double-width' : ''"
      >
        {{ button.label }}
      </va-button>
    </div>
    <div class="sgrid">
      <va-slider
        v-for="slider in sliders"
        :key="slider.id"
        v-model="slider.value"
        :min="slider.min"
        :max="slider.max"
        @change="handleSliderChange(slider.id, slider.value)"
        :label="slider.label"
        :disabled="slider.disabled"
        track-label-visible
        class="sld"
      >
      </va-slider>
    </div>
    <div class="sgrid">
      <va-checkbox
        v-for="checkbox in checkboxes"
        :key="checkbox.id"
        v-model="checkbox.checked"
        class="mb-6"
        color="primary"
        checked-icon="fa-check"
        :label="checkbox.label"
        @update:modelValue="handleCheckboxChange(checkbox.id, checkbox.checked)"
      >
      </va-checkbox>

      <div v-for="gauge in gauges" :key="gauge.id" class="gauge">
        <SimpleGauge
          :value="gauge.value"
          :max="gauge.max"
          :min="gauge.min"
          :label="gauge.label"
          :color="gauge.color"
          >{{ gauge.type }}</SimpleGauge
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";
import { onMounted } from "vue";

import SimpleGauge from "../charts/SimpleGauge.vue";

// pinia
import { useDeviceStore } from "../../stores/BleDevices";
const deviceStore = useDeviceStore();

watch(
  () => deviceStore.sensDataRaw,
  async (newVal, oldVal) => {
    //console.log('minibot status changed from', oldVal, 'to', newVal);
    const view = new DataView(newVal);
    // expect 6 int16 values + 1 byte for tof
    const accX = view.getInt16(0, true) / 1000;
    const accY = view.getInt16(2, true) / 1000;
    const accZ = view.getInt16(4, true) / 1000;
    const gyroX = view.getInt16(6, true) / 1000;
    const gyroY = view.getInt16(8, true) / 1000;
    const gyroZ = view.getInt16(10, true) / 1000;
    const distance = view.getUint8(12, true);
    //console.log("acc", accX,accY,accZ)
    //console.log("gyro", gyroX,gyroY,gyroZ)
    gauges.value[0].value = Math.round(gyroZ);
    gauges.value[1].value = Math.round(accY);
    sliders.value[2].value = distance;
  },
  { deep: true }
);

const ctlIdx = ref(0);
const botCtl = ref({
  lspeed: 0,
  rspeed: 0,
  ltrim: 0,
  rtrim: 0,
  grip: 0,
  lift: 0,
  color: 0,
});

const botReset = () => {
  for (const slider of sliders.value) {
    slider.value = 0;
  }
  for (const checkbox of checkboxes.value) {
    checkbox.checked = false;
  }

  botCtl.value.lspeed = 0;
  botCtl.value.rspeed = 0;
  botCtl.value.ltrim = 0;
  botCtl.value.rtrim = 0;
  botCtl.value.grip = 0;
  botCtl.value.lift = 0;
  botCtl.value.color = 0;
};

const botColor = (color) => {
  const r = color[0] >> 6;
  const g = color[1] >> 4;
  const b = color[2] >> 6;
  const col = (r << 6) | (g << 2) | b;
  console.log("color", col);
  return col;
};

// deviceCtl is 8 bytes + extra byte to inidcate change for pinia update
// int8 speed left,right (-10..10)
// int8 -10 ..10 trim left, right
// uint8 0..180 grip and lift
// uint8 color rgb 242
// uint8, update
const deviceCtl = ref([0, 0, 0, 0, 0, 0, 0, 0]);
const updateDevice = () => {
  console.log("Updating device");
  console.log("speed0", botCtl.value.lspeed, botCtl.value.rspeed,botScale.value);
  const lscale = botCtl.value.lspeed == 0 ? 0 : (botCtl.value.lspeed < 0 ? -1 : 1);
  const rscale = botCtl.value.rspeed == 0 ? 0 : (botCtl.value.rspeed < 0 ? -1 : 1);
  deviceCtl.value[0] = botCtl.value.lspeed + (botScale.value ? lscale * 10 : 0);
  deviceCtl.value[1] = botCtl.value.rspeed + (botScale.value ? rscale * 10 : 0);
  console.log("speed", deviceCtl.value[0], deviceCtl.value[1]);
  console.log("scale", lscale,rscale);
  deviceCtl.value[2] = botCtl.value.ltrim;
  deviceCtl.value[3] = botCtl.value.rtrim;
  deviceCtl.value[4] = botCtl.value.grip;
  deviceCtl.value[5] = botCtl.value.lift;
  deviceCtl.value[6] = botCtl.value.color;
  deviceCtl.value[7] = ++ctlIdx.value; // ref cnt

  deviceStore.setCtlData(deviceCtl.value);
};

const botWheels = ref(false);
const wheelChange = () => {
  console.log("Bot wheels changed:", botWheels.value);
  // updateDevice(); // has no effect here without setting speed
};
const botScale = ref(false);
const scaleChange = () => {
  console.log("Bot scale changed:", botScale.value);
  updateDevice();
};

onMounted(async () => {
  console.log("Mounted");
  botReset();
  updateDevice();
  gauges.value[0].value = 1;
  gauges.value[1].value = 1;
  await nextTick();
  gauges.value[0].value = 0;
  gauges.value[1].value = 0;
});

const buttons = ref([
  { id: 0, label: "FFWD", color: "primary" },
  { id: 1, label: "FWD", color: "primary" },
  { id: 2, label: "REV", color: "primary" },
  { id: 3, label: "FREV", color: "primary" },
  { id: 4, label: "Left", color: "primary" },
  { id: 5, label: "Stop", color: "warning", double: true },
  { id: 6, label: "Right", color: "primary" },
]);

const sliders = ref([
  { id: 0, value: 0, min: -5, max: 5, label: "LTrim",disabled:false },
  { id: 1, value: 0, min: -5, max: 5, label: "RTrim",disabled:false },
  { id: 2, value: 0, min: 0, max: 100, label: "Dist",disabled:true },
]);

const checkboxes = ref([
  { id: 0, checked: false, label: "Lift" },
  { id: 1, checked: false, label: "Grip" },
]);

const gauges = ref([
  { id: 0, type: "rot", label: "Rot", value: 0, min: -10, max: 10 },
  { id: 1, type: "acc", label: "Acc", value: 0, min: -5, max: 5 },
]);

const handleClick = (button) => {
  // Handle button click logic here
  console.log(`Button ${button.id} clicked`);
  switch (button.id) {
    case 0:
      botCtl.value.lspeed = 10;
      botCtl.value.rspeed = 10;
      botCtl.value.color = botColor([0, 196, 0]);
      break;
    case 1:
      botCtl.value.lspeed = 5;
      botCtl.value.rspeed = 5;
      botCtl.value.color = botColor([0, 64, 0]);
      break;
    case 2:
      botCtl.value.lspeed = -5;
      botCtl.value.rspeed = -5;
      botCtl.value.color = botColor([64, 64, 0]);
      break;
    case 3:
      botCtl.value.lspeed = -10;
      botCtl.value.rspeed = -10;
      botCtl.value.color = botColor([196, 196, 0]);
      break;
    // left and right dependant on wheels
    case 4:
      if (!botWheels.value) {
        botCtl.value.lspeed = -5;
        botCtl.value.rspeed = 5;
      } else {
        botCtl.value.lspeed = 5;
        botCtl.value.rspeed = 10;
      }
      botCtl.value.color = botColor([64, 0, 64]);
      break;
    case 6:
      if (!botWheels.value) {
        botCtl.value.lspeed = 5;
        botCtl.value.rspeed = -5;
      } else {
        botCtl.value.lspeed = 10;
        botCtl.value.rspeed = 5;
      }
      botCtl.value.color = botColor([0, 64, 64]);
      break;
    case 5:
    default:
      botCtl.value.lspeed = 0;
      botCtl.value.rspeed = 0;
      botCtl.value.color = botColor([64, 64, 64]);
      break;
  }
  updateDevice();
};

const handleSliderChange = (id, value) => {
  // Handle slider change logic here
  console.log(`Slider ${id} changed to ${value}`);
  switch (id) {
    case 0:
      botCtl.value.ltrim = value;
      break;
    case 1:
      botCtl.value.rtrim = value;
      break;
  }
  updateDevice();
};

const handleCheckboxChange = (id, checked) => {
  // Handle checkbox change logic here
  console.log(`Checkbox ${id} changed to ${checked}`);
  switch (id) {
    case 0:
      botCtl.value.lift = checked ? 180 : 0;
      break;
    case 1:
      botCtl.value.grip = checked ? 180 : 0;
      break;
  }
  updateDevice();
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

.type {
  margin-top: 1rem;
  display:inline-block;
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
  margin: auto;
}

.gauge {
  grid-column: span 1;
  width: 100%;
  height: 100%;
  text-align: center;
  grid-column: span 1;
  margin: auto;
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
