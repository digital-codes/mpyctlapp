<script setup>
import { ref } from 'vue'

import { BleClient, numbersToDataView, numberToUUID } from '@capacitor-community/bluetooth-le';

const emit = defineEmits(["init","connected", "disconnected"]);


const AUTO_SRV = '00001815-0000-1000-8000-00805f9b34fb'
const AUTO_WR = '00002a56-0000-1000-8000-00805f9b34fb'
const AUTO_RD = '00002a56-0000-1000-8000-00805f9b34fb'
const SENSE_SRV = '0000181a-0000-1000-8000-00805f9b34fb'
const SENSE_RD = '00002a6e-0000-1000-8000-00805f9b34fb'

const DEV_PREFIX = 'MpyCtl'

const BLE_DEFAULTS = {
    gattServer: null,
    devicePrefix: DEV_PREFIX,
    autoService: AUTO_SRV,
    writeAutoCharacteristic: AUTO_WR,
    readAutoCharacteristic: AUTO_RD,
    senseService: SENSE_SRV,
    readSenseCharacteristic: SENSE_RD,
    readIntervall:null,
    senseNotify:false,
    tempId: null
}

const status = ref()
const val = ref()
const btn = ref()


let bleVars;

const useNotify = true

let statusId = null

let busy = false
let commandQueue = [];

const bleInit = () => {
    bleVars = JSON.parse(JSON.stringify(BLE_DEFAULTS))
    //bleVars.tempId = document.getElementById("temp")
}

let tgl = 0
let dvc = null

const clicked = async () => {
    console.log("Clicked1")
    await blescan()
    console.log("Clicked2")
  }


const blescan = async () => {
  bleInit()
  try {
    // setting androidNeverForLocation break BLE on android (at least older versions)
    // maybe would need mods in manifest as well then ...
    //await BleClient.initialize({ androidNeverForLocation: true });
    await BleClient.initialize();
  } catch (e) {
    console.log("Error init BLE:",e)
    emit("init", false)
    return
  }
  try {
    await BleClient.requestEnable()
  } catch (e) {
    console.log("Error enable BLE:",e.message)
    emit("init", false)
  }
  emit("init", true)
  try {

    console.log("DEV:", DEV_PREFIX)
    
    const device = await BleClient.requestDevice({
      namePrefix: DEV_PREFIX,
      services: [SENSE_SRV],
      optionalServices: [AUTO_SRV],
    });

  
    // connect to device, the onDisconnect callback is optional
    await BleClient.connect(device.deviceId, (deviceId) => onDisconnect(deviceId));
    console.log('connected to device', device);
    dvc = device
    const msg = `device ${device.name} connected`
    console.log(device)
    status.value.innerHTML = msg
    const name = device.name
    emit("connected", name)


    const result = await BleClient.read(device.deviceId, SENSE_SRV, SENSE_RD);
    console.log('body sensor location', result.getUint8(0));

    let cmd = new Uint8Array([tgl]);
    await BleClient.write(device.deviceId, AUTO_SRV, AUTO_WR, cmd);
    console.log('written to control point');

    await BleClient.startNotifications(
      device.deviceId,
      SENSE_SRV,
      SENSE_RD,
      (value) => {
        console.log('current heart rate', parseHeartRate(value));
      }
    );

    // disconnect after 10 sec
    setTimeout(async () => {
      await BleClient.stopNotifications(device.deviceId, SENSE_SRV, SENSE_RD);
      await BleClient.disconnect(device.deviceId);
      console.log('disconnected from device', device);
      emit("disconnected")
    }, 10000);
  return 1  
  } catch (error) {
    console.error(error);
    return null
  }
}

function onDisconnect(deviceId) {
  //const msg = `device ${deviceId} disconnected`
  const msg = `device ${dvc.name} disconnected`
  console.log(msg)
  status.value.innerHTML = msg
  dvc = null
}

async function toggle() {
  const device = dvc
  if (device == null) return
  tgl = tgl?0:1
  let cmd = new Uint8Array([tgl]);
  await BleClient.write(device.deviceId, AUTO_SRV, AUTO_WR, cmd);
}

function parseHeartRate(value) {
  setTimeout(toggle, 100);
  const heartRate = value.getUint16(0, true)/100
  val.value.innerHTML = heartRate.toString() 
  return heartRate;
}


</script>

<template>

<h2>BLE</h2>
<p ref="status">xxx</p>
<p ref="val">xxx</p>

<va-button ref="scan" @click="clicked()">scan</va-button>

</template>

<style scoped>
</style>
