import { ref } from 'vue'

import { BleClient, numbersToDataView, numberToUUID } from '@capacitor-community/bluetooth-le';

import { useDeviceStore } from "../stores/BleDevices";

// device storage
import { dbCheck } from '../services/dataBase'

// store placeholder. must be initialized in bleInit
const store = {fn:()=>{alert("store not initialized")}}


const AUTO_SRV = '00001815-0000-1000-8000-00805f9b34fb'
const AUTO_WR = '00002a56-0000-1000-8000-00805f9b34fb'
const AUTO_RD = '00002a56-0000-1000-8000-00805f9b34fb'
const SENSE_SRV = '0000181a-0000-1000-8000-00805f9b34fb'
const SENSE_RD = '00002a6e-0000-1000-8000-00805f9b34fb'

const DEVICE_INFO_SRV = '0000180a-0000-1000-8000-00805f9b34fb';
// custom characteristics to read and write config stuff
const DEVICE_CONFIG_RD = "19e2282a-0777-4519-9d08-9bc983c3a7d0"
const DEVICE_PAIR = "bda7b898-782a-4a50-8d10-79d897ea82c2"




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

// shared iv
const ivBase = new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0])

// encrypt challenge
const encryptChallenge = async (challenge,hexKey) => {
    if (window.crypto) {
        console.log("Webcrypto available")
        // Convert string to Uint8Array
        const keyBytes = [];
        for (let i = 0; i < hexKey.length; i += 2) {
            keyBytes.push(parseInt(hexKey.substr(i, 2), 16));
        }
        console.log("Keybytes:",keyBytes)
        const keyBuf = new Uint8Array(keyBytes)
        // shared iv
        // Convert string to Uint8Array
        const ivPart = crypto.getRandomValues(new Uint8Array(4));
        console.log("ivpart:",ivPart)
        console.log("ivbase:",ivBase)
        const iv = new Uint8Array([...ivBase, ...ivPart]) //new Uint8Array(ivBase + ivBase)
        console.log("ivbytes:",iv,iv.length)
        console.log("iv:",Array.from(iv, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join(''))
        // crypto key from key data
        const key = await crypto.subtle.importKey(
            'raw', // Key format
            keyBuf,
            { name: 'AES-CBC', iv: iv },
            false, // Whether the key is extractable
            ['encrypt'] // Key usage
          );
        console.log("Key:",key)
        console.log("Data:",challenge)
        // Encrypt data using AES-GCM algorithm
        const encryptedData = await crypto.subtle.encrypt(
            {
                name: 'AES-CBC', 
                iv: iv
            },
            key,
            challenge
        );
        const enc = new Uint8Array(encryptedData)
        console.log("Encrypted data:",enc)
        const msg = new Uint8Array([...enc, ...ivPart])
        console.log("Msg:",Array.from(msg, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join(''))
        return msg
    } else {
        console.log("Webcrypto not available")
        return null
    }

}

// ----------------- BLE functions -----------------

const bleInit = async () => {
    // test crypto
    const data = new Uint8Array([1,2,3,0]);
    const enc = await encryptChallenge(data,"1234567890abcdef1234567890abcdef")
    console.log("Encrypted:",enc)
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
            optionalServices: [AUTO_SRV, DEVICE_INFO_SRV],
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
        //console.log("Current device:",device)
        const result = await client.read(device.deviceId, DEVICE_INFO_SRV, DEVICE_CONFIG_RD);
        console.log("config length:",result.byteLength)
        console.log('config value', result.getUint8(0));
        return result.getUint8(0)
    } catch (e) {
        console.log("Error ",e.message)
        return null
    }
}
const bleReadPair = async () => {
    try {
        if (!store.fn.connected) throw new Error("No device connected")
        const device = store.fn.device
        //console.log("Current device:",device)
        const result = await client.read(device.deviceId, DEVICE_INFO_SRV, DEVICE_PAIR);
        console.log("pair length:",result.byteLength)
        const pin = new Uint8Array(result.buffer)
        console.log('pin value', pin);
        return pin
    } catch (e) {
        console.log("Error ",e.message)
        return null
    }
}
const bleWritePair = async () => {
    try {
        if (!store.fn.connected) throw new Error("No device connected")
        const device = store.fn.device
        console.log("Current device:",device.name)
        // find key for device
        const key = await dbCheck(device.name)
        if (key == null) {
            throw new Error("No key found for device")
        }
        console.log("Key:",key)
        const r = await bleReadPair()
        console.log("pair1 returned:",r)
        const encryptedPair = await encryptChallenge(r,key)
        console.log("Encrypted pair:",encryptedPair,encryptedPair.length)
        await client.write(device.deviceId, DEVICE_INFO_SRV, DEVICE_PAIR, encryptedPair);
        await new Promise(resolve => setTimeout(resolve, 100));
        //store.fn.setDevkey(data);
        store.fn.setPaired(true)
    } catch (e) {
        console.log("Error ",e.message)
        return null
    }
}

const bleStartNotify = async () => {
    try {
        if (!store.fn.connected) throw new Error("No device connected")
        const device = store.fn.device
        //console.log("Current device:",device)
        await client.startNotifications(
            device.deviceId,
            SENSE_SRV,
            SENSE_RD,
            (value) => {
              //emit("notify", value)
              //console.log('sensor value',value.getUint16(0,true) );
              //store.fn.setSensData([value.getUint16(0,true)])
              console.log('notify len:',value.byteLength);
              // we can iterate over input data
              console.log('sensor value',value.getInt16(0,true) );
              store.fn.setSensData([value.getInt16(0,true)])
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
        //console.log("Current device:",device)
        await BleCliclientent.stopNotifications(device.deviceId, SENSE_SRV, SENSE_RD);
    } catch (e) {
        console.log("Error ",e.message)
    }
}

const bleReadDigital = async () => {
    try {
        if (!store.fn.connected) throw new Error("No device connected")
        const device = store.fn.device
        //console.log("Current device:",device)
        const result = await client.read(device.deviceId, AUTO_SRV, AUTO_RD);
        console.log('sensor value', result.getUint8(0));
        return result.getUint8(0)
    } catch (e) {
        console.log("Error ",e.message)
        return null
    }
}

const bleWriteDigital = async (data) => {
    try {
        if (!store.fn.connected) throw new Error("No device connected")
        const device = store.fn.device
        //console.log("Current device:",device)
        let cmd = new Uint8Array([data,1,2,3,4,5]);
        await client.write(device.deviceId, AUTO_SRV, AUTO_WR, cmd);
        //console.log('data written');
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
    bleWritePair,
    bleReadPair,
    bleReadSensor,
}

