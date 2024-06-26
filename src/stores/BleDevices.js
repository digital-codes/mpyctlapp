import { defineStore } from 'pinia'

// You can name the return value of `defineStore()` anything you want,
// but it's best to use the name of the store and surround it with `use`
// and `Store` (e.g. `useUserStore`, `useCartStore`, `useProductStore`)
// the first argument is a unique id of the store across your application
export const useDeviceStore = defineStore('device', {
    state: () => {
        return {
            connected: false,
            paired: false,
            devname: 'mpyctl',
            devkey: '',
            device: {},
            personality: 0,
            sensData: [],
            sensDataRaw: new ArrayBuffer(),
            configData: [],
            ctlData: []
        }
    },
    getters: {
        getTemperature() {
            return this.sensData[0] / 100 
        }
    },
    actions: {
        // This is an action that can be called from the app
        setDevname(name) {
            this.devname = name
        },
        setDevkey(key) {
            this.devkey = key
        },
        setConnected(c) {
            this.connected = c
            if (!c) this.paired = false // also clear pair
        },
        setPaired(paired) {
            this.paired = paired && this.connected
        },
        setPersonality(data) {
            if (this.paired) {
                this.personality = data
            } else {
                this.personality = 0
            }
        },
        setDevice(device) {
            this.device = device
        },
        setSensData(data) {
            this.sensData = data
        },
        setSensDataRaw(data) {
            this.sensDataRaw = data
        },
        setConfigData(data) {
            this.configData = data
        },
        setCtlData(data) {
            if (this.paired) {
                console.log("Writing ctl",data)
                this.ctlData = data
                console.log("ctl ...",this.ctlData)
            }
        }
    }
})  // This is the store that will be used in the app

