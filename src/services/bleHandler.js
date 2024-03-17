import { ref } from 'vue'

import { BleClient, numbersToDataView, numberToUUID } from '@capacitor-community/bluetooth-le';

import { useDeviceStore } from "../stores/BleDevices";

// store placeholder. must be initialized in bleInit
const store = {fn:()=>{alert("store not initialized")}}


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

let client = null

// internal function to handle disconnect
const onDisconnect = (deviceId) => {
    try {
        if (!store.fn.connected) throw new Error("No device connected")
        console.log("Disconnecting:",deviceId)
        const device = store.fn.device
        console.log("Current device:",device)
        store.fn.setConnected(false)
        console.log('disconnected');
    } catch (e) {
        console.log("Error ",e.message)
    }
}

// ----------------- BLE functions -----------------

const bleInit = async () => {
    // set client
    client = BleClient
    // init store
    store.fn = useDeviceStore()
    bleVars = JSON.parse(JSON.stringify(BLE_DEFAULTS))
    try {
        // no requestEnable on browser
        await client.requestEnable()
        console.log("BLE enabled")
    } catch (e) {
        console.log("Error request enable BLE:",e.message)
    }
    try {
        // setting androidNeverForLocation break BLE on android (at least older versions)
        // maybe would need mods in manifest as well then ...
        //await BleClient.initialize({ androidNeverForLocation: true });
        await client.initialize();
        console.log("BLE initialized")
        return true
      } catch (e) {
        console.log("Error init BLE:",e)
        return false
      }
}

const bleConnect = async () => {
    console.log("Prefix:", DEV_PREFIX)
    try {
        console.log("connected:",store.fn.connected)
        if (store.fn.connected) throw new Error("Device already connected")
        console.log("Client:",client)
        const device = await client.requestDevice({
            namePrefix: DEV_PREFIX,
            services: [SENSE_SRV],
            optionalServices: [AUTO_SRV],
          });
          console.log('Request result:', device);
          // connect to device, the onDisconnect callback is optional
          await client.connect(device.deviceId, (deviceId) => onDisconnect(deviceId))
          console.log('connected to device', device,device.name);
          store.fn.setDevice(device)
          store.fn.setDevname(device.name);
          store.fn.setConnected(true);
    } catch {
        console.log("Error connect BLE")
    }
    console.log("connect done") 
}

const bleDisconnect = async () => {
    console.log("Current device:",store.fn.device)
    if (store.fn.connected) {
        const device = store.fn.device
        console.log("Current device:",device)
        try {
            await client.disconnect(device.deviceId);
            console.log('disconnected from device', device);
            // store handled by ondisconnect
        } catch {
            console.log("Error disconnect BLE")
        }
    }
}

const bleReadSensor = async () => {
    console.log("Current device:",store.fn.device)
    try {
        if (!store.fn.connected) throw new Error("No device connected")
        const device = store.fn.device
        console.log("Current device:",device)
        const result = await client.read(device.deviceId, SENSE_SRV, SENSE_RD);
        console.log('sensor value', result.getUint8(0));
        return result.getUint8(0)
    } catch (e) {
        console.log("Error ",e.message)
        return null
    }
}

const bleReadConfig = async () => {
    try {
        if (!store.fn.connected) throw new Error("No device connected")
        const device = store.fn.device
        console.log("Current device:",device)
        const result = await client.read(device.deviceId, SENSE_SRV, SENSE_RD);
        console.log('sensor value', result.getUint8(0));
        return result.getUint8(0)
    } catch (e) {
        console.log("Error ",e.message)
        return null
    }
}
const bleReadDigital = async () => {
    try {
        if (!store.fn.connected) throw new Error("No device connected")
        const device = store.fn.device
        console.log("Current device:",device)
        const result = await client.read(device.deviceId, SENSE_SRV, SENSE_RD);
        console.log('sensor value', result.getUint8(0));
        return result.getUint8(0)
    } catch (e) {
        console.log("Error ",e.message)
        return null
    }
}
const bleStartNotify = async () => {
    try {
        if (!store.fn.connected) throw new Error("No device connected")
        const device = store.fn.device
        console.log("Current device:",device)
        await client.startNotifications(
            device.deviceId,
            SENSE_SRV,
            SENSE_RD,
            (value) => {
              //emit("notify", value)
              console.log('sensor value',value.getUint16(0,true) );
              store.fn.setSensData([value.getUint16(0,true)])
            }
          );
        // const sensVal = value.getUint16(0, true)/100
    } catch (e) {
        console.log("Error ",e.message)
    }
}
const bleStopNotify = async () => {
    try {
        if (!store.fn.connected) throw new Error("No device connected")
        const device = store.fn.device
        console.log("Current device:",device)
        await BleCliclientent.stopNotifications(device.deviceId, SENSE_SRV, SENSE_RD);
    } catch (e) {
        console.log("Error ",e.message)
    }
}

const bleWriteDigital = async (data) => {
    try {
        if (!store.fn.connected) throw new Error("No device connected")
        const device = store.fn.device
        console.log("Current device:",device)
        let cmd = new Uint8Array([data]);
        await client.write(device.deviceId, AUTO_SRV, AUTO_WR, cmd);
        console.log('daat written');
    } catch (e) {
        console.log("Error ",e.message)
    }
}



export {
    bleDisconnect, 
    bleConnect, 
    bleInit, 
    bleReadDigital,
    bleWriteDigital,
    bleStopNotify,
    bleStartNotify,
    bleReadConfig,
    bleReadSensor,
}

