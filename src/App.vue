<script setup>
import { onMounted, ref, shallowRef, watch } from "vue";
import logo from "./assets/imgs/logo.png";

import ExitCheck from "./components/ExitCheck.vue";
import EmptyView from "./components/personalities/EmptyView.vue";

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

import { defineAsyncComponent } from 'vue'
/*
const AsyncComp = defineAsyncComponent(() =>
  import('./components/MyComponent.vue')
)
const RoverCtl = defineAsyncComponent(() =>
  import('./components/personalities/RoverCar.vue') 
)
*/


const currentPersonality = shallowRef('DefaultPersonality');

const personalityComponents = [
defineAsyncComponent(() => import('./components/charts/SimpleChart.vue')),
defineAsyncComponent(() => import('./components/charts/SimpleChart.vue')),
defineAsyncComponent(() => import('./components/personalities/ImuBView.vue')),
defineAsyncComponent(() => import('./components/personalities/RoverCar.vue'))
]

/*
const personalities = [
DefaultPersonality: defineAsyncComponent(() => import('./components/charts/SimpleChart.vue')),
      RoverCtl: defineAsyncComponent(() => import('./components/personalities/RoverCar.vue')),
      MxImu: defineAsyncComponent(() => import('./components/charts/ImuView.vue')),

]
      // Add more personalities as needed
    };
*/

  // Function to change personality
const changePersonality = async (personalityId) => {
      currentPersonality.value = personalityComponents[personalityId];
    }

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
    // console.log('sensor changed from', oldVal[0], 'to', newVal[0]);
    // You can add more actions here when devkey changes
    const personality = deviceStore.personality
    switch (personality) {
      case 1:
        console.log("Personality 1")
        break;
      case 2:
        // IMU demo
        if (bleTgl.value > 10) {
          bleTgl.value = 0
          await BleHandler.bleWriteDigital([1])
          //console.log("TGL Personality:", personality)
        }
        bleTgl.value += 1
        break;
      case 3:
        // Rover Car
          console.log("Rover Car:", personality)
          break
      default:
        console.log("Unknown personality")
        await BleHandler.bleWriteDigital([bleTgl.value])
        bleTgl.value = bleTgl.value ? 0 : 1
        break;
    } 
  },
  { deep: true }
)

watch(
  () => deviceStore.ctlData,
  async (newVal, oldVal) => {
    console.log('ctl changed from', oldVal, 'to', newVal);
    await BleHandler.bleWriteDigital(newVal)
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
          // get config, string encoded or raw object
          let cfg = dev[d].config
          if (!(typeof cfg === 'object' && cfg !== null)) {
            // config is a string!
            cfg = JSON.parse(dev[d].config)
          }
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
    await changePersonality(0)
  }
  // preference database
  // set default key for mpyctl_0001
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
      const cfg = await BleHandler.bleReadConfig()
      console.log("Config: ",cfg)
      await changePersonality(cfg)
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
  }
};
CApp.addListener("backButton", closeApp);


const goto = (pg) => {
  page.value = pg;
  showSidebar.value = false;
};

const menuToggle = () => {
  showSidebar.value = !showSidebar.value;
};


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
              <VaListItemSection>
                <VaListItemLabel>{{ item }}</VaListItemLabel>
              </VaListItemSection>
            </VaListItem>
          </VaList>
        </div>

        <!-- 
        <ImuBView></ImuBView>
        -->

      </main>
      <main v-show="page === 2" class="p-4">
        <div v-if="deviceStore.paired">

          <div class="personality">
            <component :is="currentPersonality"></component>
          </div>

        </div>
        <div v-else>
          <p>Device not paired</p>
          <EmptyView></EmptyView>
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

.personality 
{
  display: block;
  margin-top: 1rem;
}

</style>
