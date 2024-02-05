import { SplashScreen } from '@capacitor/splash-screen';

import { createApp } from 'vue'

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



