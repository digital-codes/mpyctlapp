<script setup>
import { onMounted, ref, watch } from "vue";
import logo from "./assets/imgs/logo.png";

import ExitCheck from "./components/ExitCheck.vue";
import SimpleChart from "./components/SimpleChart.vue";
import RoverCtl from "./components/RoverCtl.vue";

import { getMotionCtl } from "./services/motionCtl";

import { App as CApp } from "@capacitor/app";

import { Device } from "@capacitor/device";
import { Capacitor } from "@capacitor/core";

// pinia
import { useDeviceStore } from "./stores/BleDevices";
const deviceStore = useDeviceStore()

import * as BleHandler from "./services/bleHandler"

const logDeviceInfo = async () => {
  const info = await Device.getInfo();
  console.log(info);
};

// storage
import { dbSet, dbCheck, dbRemove, dbKeys } from './services/dataBase'

const deviceFiles = ref([]);

const knownDevices = ref([]);

const showSidebar = ref(false);
const page = ref(1);

const exitCheck = ref();

const schart = ref();

const bleTgl = ref(0)

watch(
  () => deviceStore.sensData,
  async (newVal, oldVal) => {
    // console.log('sensor changed from', oldVal, 'to', newVal);
    console.log('sensor changed from', oldVal[0], 'to', newVal[0]);
    // You can add more actions here when devkey changes
    await BleHandler.bleWriteDigital(bleTgl.value)
    bleTgl.value = bleTgl.value ? 0 : 1
  },
  { deep: true }
)

watch(
  () => deviceFiles.value,
  async (newVal, oldVal) => {
    console.log('Devices', newVal);
    try {
      const file = newVal[0]; // Get the first file

      if (!file) {
        console.log('No file selected!');
        return;
      }

      const reader = new FileReader();

      // Setup onload event for reader
      reader.onload = async (e) => {
        // The file's text will be printed here
        const dev = JSON.parse(e.target.result)
        console.log("Content...:", dev)
        for (const d in dev) {
          console.log("Name:", dev[d].name)
          // config is a string!
          const cfg = JSON.parse(dev[d].config)
          console.log("Key:", cfg.ble.key)
          await dbSet(dev[d].name, cfg.ble.key)
          knownDevices.value.push(dev[d].name)

        }
        deviceFiles.value = [] // close field
      };
      // Read the file as text
      await reader.readAsText(file);
    } catch (error) {
      console.log("Error:", error)
    }
  }
)


onMounted(async () => {
  console.log("App mounted");
  logDeviceInfo();

  const platform = Capacitor.getPlatform();
  console.log("Platform:", platform);

  const bleOk = await BleHandler.bleInit()
  if (bleOk) {
    console.log("Ble init ok")
  } else {
    console.log("Ble init failed")
  }
  // preference database
  // set key for mpyctl_0001
  const devId = "MpyCtl_0001"
  await dbSet(devId, "ee540e93c07e27db8da1648ed27214dd")
  const k = await dbKeys()
  console.log("Keys:", k)
  console.log(await dbCheck(devId))
});

const getDevice = async () => {
  await BleHandler.bleConnect()
  if (deviceStore.connected) {
    await BleHandler.bleWritePair()
    if (deviceStore.paired) {
      await BleHandler.bleStartNotify()
      page.value = 2
    }
  }
}

const dropDevice = async () => {
  await BleHandler.bleStopNotify()
  await BleHandler.bleDisconnect()
}


const closeApp = async () => {
  console.log("Closing app");
  logDeviceInfo();
  if (await exitCheck.value.show()) {
    CApp.exitApp();
  } else {
    schart.value.pushData(Math.random());
  }
};
CApp.addListener("backButton", closeApp);

setInterval(() => {
  if (schart.value) schart.value.pushData(Math.random());
}, 200);

const goto = (pg) => {
  page.value = pg;
  showSidebar.value = false;
};

const menuToggle = () => {
  showSidebar.value = !showSidebar.value;
};

const handleRoverButton = (payload) => {
  // Handle the emitted event from RoverCtl component
  console.log("Button emit from RoverCtl:", payload);
  // Perform any necessary actions based on the emitted data
  const ctl = getMotionCtl(123);
  viewCtl(ctl);
};
const handleRoverSlider = (payload) => {
  // Handle the emitted event from RoverCtl component
  console.log("Slider emit from RoverCtl:", payload);
  // Perform any necessary actions based on the emitted data
  const ctl = getMotionCtl(123);
  viewCtl(ctl);
};
const handleRoverCheck = (payload) => {
  // Handle the emitted event from RoverCtl component
  console.log("Checkbox emit from RoverCtl:", payload);
  // Perform any necessary actions based on the emitted data
  const ctl = getMotionCtl(123);
  viewCtl(ctl);
};

//

const viewCtl = (val) => {
  const view = new DataView(val);
  for (let i = 0; i < 8; i++) {
    console.log(view.getUint8(i).toString(2).padStart(8, "0"));
  }
}
</script>

<template>
  <VaLayout style="height: 500px">
    <template #top>
      <ExitCheck ref="exitCheck"></ExitCheck>

      <VaNavbar color="primary" class="py-2">
        <template #left>
          <VaButton :icon="showSidebar ? 'fa-xmark' : 'fa-bars'" @click="menuToggle()" />
        </template>
        <template #center>
          <VaNavbarItem class="font-bold text-lg"> LOGO </VaNavbarItem>
        </template>
        <template #right>
          <VaNavbarItem class="navbar-item-slot avatar">
            <VaAvatar class="w-full md:w-1/2 lg:w-1/3" :src="logo" />
          </VaNavbarItem>
        </template>
      </VaNavbar>
    </template>

    <template #left>
      <VaSidebar v-model="showSidebar" class="py-4">
        <VaSidebarItem :active="page === 1" @click="goto(1)">
          <VaSidebarItemContent>
            <VaIcon name="fab-bluetooth-b" />
            <VaSidebarItemTitle> Home </VaSidebarItemTitle>
          </VaSidebarItemContent>
        </VaSidebarItem>
        <VaSidebarItem :active="page === 2" @click="goto(2)">
          <VaSidebarItemContent>
            <VaIcon name="fas-robot" size="large" spin="counter-clockwise" color="secondary" />
            <VaSidebarItemTitle> Rover </VaSidebarItemTitle>
          </VaSidebarItemContent>
        </VaSidebarItem>
        <!-- 
        <VaSidebarItem :active="page === 3" @click="goto(3)">
          <VaSidebarItemContent>
            <VaIcon name="fas-chart-line" color="secondary" />
            <VaSidebarItemTitle> Chart </VaSidebarItemTitle>
          </VaSidebarItemContent>
        </VaSidebarItem>
        -->
      </VaSidebar>
    </template>

    <template #content>
      <main v-show="page === 1" class="p-4">
        <h3 class="va-h3">Page 1</h3>
        <va-button ref="scan" v-if="!deviceStore.connected" @click="getDevice">Connect</va-button>
        <va-button v-if="deviceStore.connected" @click="dropDevice">Disconnect</va-button>
        <p>{{ deviceStore.getTemperature }}</p>
        <div v-if="deviceStore.connected">
          <p>Connected to device: {{ deviceStore.devname }}</p>
          <div v-if="!deviceStore.paired">
            <p>Device not paired</p>
          </div>
        </div>
        <div v-else class="upload">
          <p>Upload Devices</p>
          <VaFileUpload v-model="deviceFiles" file-types="json" />
        </div>
        <div class="devlist">
          <VaList>
            <VaListItem v-for="(item,idx) in knownDevices" :key="idx">
              <VaListItemContent>
                <VaListItemTitle>{{ item }}</VaListItemTitle>
              </VaListItemContent>
            </VaListItem>
          </VaList>
        </div>
      </main>
      <main v-show="page === 2" class="p-4">
        <h3 class="va-h3">Rover Control</h3>
        <div v-if="deviceStore.paired">
          <RoverCtl @button-click="handleRoverButton" @slider-change="handleRoverSlider"
            @checkbox-change="handleRoverCheck">
          </RoverCtl>
          <SimpleChart ref="schart"></SimpleChart>
        </div>
        <div v-else>
          <p>Device not paired</p>
        </div>
      </main>
    </template>
  </VaLayout>
</template>

<style>
#app {
  text-align: center;
  color: var(--ep-text-color-primary);
}

.main-container {
  height: calc(100vh - var(--ep-menu-item-height) - 3px);
}
</style>

<style scoped>
.navbar-item-slot {
  border: 1px dashed var(--va-secondary);
  padding: 6px 10px;
}

.avatar {
  border: unset;
}

.devlist {
  margin: 10px auto;
}

.va-input {
  --va-input-font-size: 1.5rem;
}

</style>

<style>
.va-modal__footer {
  display: block;
}

.va-input-label {
  font-size: 1rem;
}

.upload > .va-file-upload > .va-file-upload__field {
  display:unset;
}


</style>
