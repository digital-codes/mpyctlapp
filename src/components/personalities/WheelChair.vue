<template>
  <div class="device-ctl">
    <div class="bgrid">
      <component v-for="(item, idx) in items" :key="item.id" @change="handleSliderChange(item)"
        @click="handleClick(item)" :color="item.color" :class="item.cls" :is="item.type" :vertical="item.vertical"
        :disabled="item.disabled" min=0 max=10 track-label-visible square v-model="item.value" :label="item.label">
        <va-icon v-if="(item.label == '') && (item.icon != undefined)" class="fas" :class="item.icon" size="3rem" />
        <span v-if="item.label != ''" class="label">
          {{ item.label }}
        </span>
      </component>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";

// pinia
import { useDeviceStore } from "../../stores/BleDevices";

const deviceStore = useDeviceStore()

const defaultSpeed = 0
const defaultTurn = 5

// ui elements top left to bottom right
const items = ref([
  { id: 0, type: "va-chip", value: true, icon: "fa-check", vertical: false, disabled: false, label: "", cls: "", color: "#00ff00" },
  { id: 1, type: "va-chip", value: true, vertical: false, disabled: false, label: "SpeedDisplay", cls: "double-width", color: "secondary" },
  { id: 2, type: "va-button", value: true, vertical: false, disabled: false, label: "Start", cls: "double-width", color: "primary" },
  { id: 3, type: "va-slider", value: defaultSpeed, vertical: true, disabled: true, label: "SpeedCtl", cls: "sld double-height", color: "primary" },
  { id: 4, type: "va-button", value: true, vertical: false, disabled: false, label: "Stop", cls: "double-width", color: "primary" },
  { id: 5, type: "va-button", value: false, icon: "fa-up-long", vertical: false, disabled: true, label: "", cls: "", color: "primary" },
  { id: 6, type: "va-slider", value: defaultTurn, vertical: false, disabled: true, label: "Turn", cls: "sld double-width", color: "primary" },
]);


// device ctl is 7 bytes
const deviceCtl = ref([0, 0, 0, 0, 0, 0, 0])


onMounted(() => {
  console.log("Mounted");
  // buttons and checks are off by default. transmit default slider values only
  stop()
})

watch(
  () => deviceStore.sensDataRaw,
  async (newVal, oldVal) => {
    //console.log('wheel status changed from', oldVal, 'to', newVal);
    const view = new DataView(newVal);
    // expect 3 values, status(byte), turn(byte), speed(uint16)
    const status = view.getUint8(0, true)
    const turn = view.getUint8(1, true)
    //console.log("turn", turn)
    const speed = view.getUint16(2, true)
    //console.log("status", status)
    switch (status) {
      case 0:
        items.value[0].color = "#00ff00"
        //items.value[0].label = "OK"
        items.value[0].icon = "fa-check"
        break;
      case 1:
        items.value[0].color = "#ffff00"
        //items.value[0].label = "???"
        items.value[0].icon = "fa-battery-empty"
        break;
      case 2:
        items.value[0].color = "#0000ff"
        //items.value[0].label = "???"
        items.value[0].icon = "fa-triangle-exclamation"
        break;
      case 3:
        items.value[0].color = "#ff0000"
        //items.value[0].label = "Error"
        items.value[0].icon = "fa-bomb" // xmark
        break;
    }
    items.value[1].label = String(speed)
  },
  { deep: true }
)

const ctlIdx = ref(0)

const updateDevice = (status = 0) => {
  console.log("Updating device", status)
  // deviceCtl is 5 bytes, last one only to inidcate change for pinia update
  // 0: starting, 1: speed, 2: turn, 3: direction
  deviceCtl.value[0] = status   // normal, starting, stopping
  deviceCtl.value[1] = items.value[3].value // speed
  deviceCtl.value[2] = items.value[6].value // turn
  deviceCtl.value[3] = items.value[5].value ? 1 : 0 // direction
  deviceCtl.value[4] = ++ctlIdx.value // ref cnt
  deviceStore.setCtlData(deviceCtl.value)
}

const stop = () => {
  items.value[3].value = 0
  items.value[6].value = 5
  items.value[2].disabled = false
  items.value[3].disabled = true
  updateDevice(2)
}

const start = () => {
  items.value[3].value = 0
  items.value[6].value = 5
  items.value[2].disabled = true
  items.value[3].disabled = false
  updateDevice(1)
}

const handleClick = (item) => {
  // ignore chips and sliders
  if (item.type != "va-button") {
    return
  }
  // Handle button click logic here
  console.log(` Item ${item.id} clicked`);
  switch (item.id) {
    case 2:
      // start
      start()
      break;
    case 4:
      // stop
      stop()
      break;
    case 5:
      // direction
      items.value[item.id - 1].value = !items.value[item.id - 1].value
      items.value[item.id - 1].icon = items.value[item.id - 1].value ? "fa-up-long" : "fa-down-long"
      updateDevice()
      break;
  }
};

const handleSliderChange = (item) => {
  // ignore chips and sliders
  if (item.type != "va-slider") {
    return
  }
  // Handle slider change logic here
  console.log(`Slider ${item.id} changed to ${item.value}`);
  updateDevice()
};

</script>

<style scoped>
.device-ctl {
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
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 10px;
}


.double-width {
  grid-column: span 2;
  /* Makes the item span two columns */
}

.double-height {
  grid-row: span 2;
  /* Makes the item span two columns */
}

button {
  width: 100%;
  height: 6rem;
}

.va-chip {
  width: 100%;
  height: 6rem;
}

.label {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
}

.va-slider {
  border: solid 4px green;
  border-radius: 5px;
  /*
  background-color: rgba(0,0,200,.3);
  */
}

.va-slider--disabled {
  border: solid 4px #f0f0f0;
  /*
  background-color: #f0f0f0;
  */
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
