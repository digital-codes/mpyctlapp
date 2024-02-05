import { SplashScreen } from '@capacitor/splash-screen';

//import { blescan, setId } from "./utils/blescan"

import { App as CApp } from '@capacitor/app';

import { createApp } from 'vue'

//import './style.css'

import App from './App.vue'

import { createVuestic } from "vuestic-ui";
import "vuestic-ui/css";

import "material-design-icons-iconfont/dist/material-design-icons.min.css";

// override 
import "./css/style.css"
import "./css/fonts.css"


const app = createApp(App)
app.use(createVuestic())
app.mount('#app')


const closeApp = () => {
  console.log("Closing app")
  CApp.exitApp()
}
CApp.addListener('backButton', closeApp)


