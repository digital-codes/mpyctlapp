<script setup>
import { ref } from 'vue'
import logo from "./assets/imgs/logo.png"

import BleScan from "./components/BleScan.vue"
import ExitCheck from "./components/ExitCheck.vue"
import SimpleChart from "./components/SimpleChart.vue"

import { App as CApp } from '@capacitor/app';

import { Device } from '@capacitor/device';

const logDeviceInfo = async () => {
  const info = await Device.getInfo();
  console.log(info);
};


const showSidebar = ref(false)
const page = ref(1)

const exitCheck = ref()

const schart = ref()

const closeApp = async () => {
  console.log("Closing app")
  logDeviceInfo()
  if (await exitCheck.value.show()) {
    CApp.exitApp()
  } else {
    schart.value.pushData(Math.random())
  }
}
CApp.addListener('backButton', closeApp)

setInterval(() => { if (schart.value) schart.value.pushData(Math.random())},200)

const goto = (pg) => {
  page.value = pg
  showSidebar.value = false
}

const menuToggle = () => {
  showSidebar.value = !showSidebar.value
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
          <VaNavbarItem class="font-bold text-lg">
            LOGO
          </VaNavbarItem>
        </template>
        <template #right>
          <VaNavbarItem class="navbar-item-slot avatar">
            <VaAvatar class="w-full md:w-1/2 lg:w-1/3" :src="logo" />
          </VaNavbarItem>
        </template>
      </VaNavbar>
    </template>

    <template #left>
      <VaSidebar v-model="showSidebar" class="py-4" >
        <VaSidebarItem :active="page === 1" @click="goto(1)">
          <VaSidebarItemContent>
            <VaIcon name="fab-github" size="small"  spin/>
            <VaIcon name="fab-github" size="large" />
            <VaSidebarItemTitle>
              Home
            </VaSidebarItemTitle>
          </VaSidebarItemContent>
        </VaSidebarItem>
        <VaSidebarItem :active="page === 2" @click="goto(2)">
          <VaSidebarItemContent>
            <VaIcon name="fas-phone" spin="counter-clockwise" color="secondary"/>
            <VaSidebarItemTitle>
              About
            </VaSidebarItemTitle>
          </VaSidebarItemContent>
        </VaSidebarItem>
      </VaSidebar>
    </template>

    <template #content>
      <main v-if="page === 1" class="p-4">
        <h3 class="va-h3">
          Page 1
        </h3>

        <BleScan></BleScan>

        <p>Page content must be wrapped in main tag. You must do it manually. Here you can place any blocks you need in
          your application.</p>

        <p>For example, you can place here your router view, add sidebar with navigation in #left slot.</p>
        <p>If you're using VaSidebar for page navigation don't forget to wrap it in nav tag.</p>
      </main>
      <main v-else-if="page === 2" class="p-4">
        <h3 class="va-h3">
          Page 2
        </h3>
        <p>Page content must be wrapped in main tag. You must do it manually. Here you can place any blocks you need in
          your application.</p>
        <SimpleChart ref="schart"></SimpleChart>

        <p>For example, you can place here your router view, add sidebar with navigation in #left slot.</p>
        <p>If you're using VaSidebar for page navigation don't forget to wrap it in nav tag.</p>
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
  border:unset;
}

</style>


<style>
.va-modal__footer {
  display: block;
}
</style>