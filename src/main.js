import { SplashScreen } from '@capacitor/splash-screen';

import { createApp } from 'vue'

import App from './App.vue'

import { createVuestic, createIconsConfig } from "vuestic-ui";
import "vuestic-ui/css";

// fontwaesome icons
import '@fortawesome/fontawesome-free/css/all.min.css'

// remove material icons
//import "material-design-icons-iconfont/dist/material-design-icons.min.css";

// override 
import "./css/style.css"
import "./css/fonts.css"

// storage
import { createPinia } from 'pinia'


// fontawesome font setup
const fonts = [
    {
        name: 'fas-{code}',
        resolve: ({code}) => ({
            class: `fas fa-${code}`,
            //content:"",
            //attrs:"",
            //tag:"", 
        }),
      },
      {
        name: 'fa-{code}',
        resolve: ({code}) => ({
            class: `fa fa-${code}`,
            //content:"",
            //attrs:"",
            //tag:"", 
        }),
      },
      {
        name: 'fab-{code}',
        resolve: ({code}) => ({
            class: `fab fa-${code}`,
            //content:"",
            //attrs:"",
            //tag:"", 
        }),
      }
    ]

const aliases = []

const app = createApp(App)
const pinia = createPinia()

app.use(createVuestic({
    config: {
        icons: createIconsConfig({ aliases, fonts }),
        components: {
          /* ... */
          all: { /* ... */ },
          presets: { /* ... */ },
        },
        colors: { /* ... */ },
      },    
}))
app.use(pinia)
app.mount('#app')



