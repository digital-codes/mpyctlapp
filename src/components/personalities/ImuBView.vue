<script setup>
import { onMounted, onUnmounted, ref, nextTick, watch } from 'vue';

import * as BABYLON from '@babylonjs/core';

// pinia
import { useDeviceStore } from "../../stores/BleDevices";
const deviceStore = useDeviceStore()



const imuContainer = ref(null);
const imuDisplay = ref(null);

const imuData = ref({
    x: 0,
    y: 0,
    z: 0,
    w: 1
});

const imuAcc = ref({
    x: 0,
    y: 0,
    z: 0
});


// Function to calculate roll and pitch from accelerometer data
function calculateOrientation(ax, ay, az) {
    const g = Math.sqrt(ax * ax + ay * ay + az * az); // Normalize the acceleration vectors
    const roll = Math.atan2(ay, az); // Rotation around x-axis
    const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az)); // Rotation around y-axis
    return { roll, pitch };
}

/*
// Function to convert roll and pitch to quaternion
function eulerToQuaternion(roll, pitch) {
    const cy = Math.cos(0 / 2);  // cos(yaw / 2) = cos(0 / 2) because yaw = 0
    const sy = Math.sin(0 / 2);  // sin(yaw / 2) = sin(0 / 2)
    const cr = Math.cos(roll / 2);
    const sr = Math.sin(roll / 2);
    const cp = Math.cos(pitch / 2);
    const sp = Math.sin(pitch / 2);

    const w = cr * cp * cy + sr * sp * sy; // Quaternion w
    const x = sr * cp * cy - cr * sp * sy; // Quaternion x
    const y = cr * sp * cy + sr * cp * sy; // Quaternion y
    const z = cr * cp * sy - sr * sp * cy; // Quaternion z

    return { w, x, y, z };
}
*/

// Function to create quaternion from Euler angles
const eulerToQuaternion = (x, y, z) => {
    return BABYLON.Quaternion.RotationYawPitchRoll(BABYLON.Angle.FromDegrees(y).radians(), BABYLON.Angle.FromDegrees(x).radians(), BABYLON.Angle.FromDegrees(z).radians());
};


const updateOrientation = (quaternion) => {
    const q = new BABYLON.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    box.value.rotationQuaternion = q
}

const t = ref(null)

const startEmu = () => {
    console.log("emu started")
    t.value = setInterval(() => {
        imuData.value = eulerToQuaternion(imuAcc.value.x, imuAcc.value.y, imuAcc.value.z);
        imuAcc.value.x = (Math.random() * 2 - 1)*180;
        imuAcc.value.y = (Math.random() * 2 - 1)*180;
        imuAcc.value.z = (Math.random() * 2 - 1)*180;
        updateOrientation(imuData.value);
    }, 1000);
}

watch(
  () => deviceStore.sensDataRaw,
  async (newVal, oldVal) => {
    // console.log('sensor changed from', oldVal, 'to', newVal);
    // console.log('sensor changed from', oldVal[0], 'to', newVal[0]);
    // You can add more actions here when devkey changes
    const view = new DataView(newVal);
    // we have 5 short int and 2 chars
    /*
    for (let i = 0; i < 5; i++) {
        const val = (view.getInt16(i * 2,true))/1000;
        console.log(val);
    }
    for (let i = 10; i < 12; i++) {
        const val = view.getInt8(i);
        console.log(val);
    }
    */
    imuData.value = {
        x: (view.getInt16(2,true))/1000,
        y: (view.getInt16(4,true))/1000,
        z: (view.getInt16(6,true))/1000,
        w: (view.getInt16(0,true))/1000
    }
    updateOrientation(imuData.value);
  },
  { deep: true }
)


const handleResize = () => {
    return
    const width = imuContainer.value.clientWidth;
    const height = imuContainer.value.clientHeight;
    console.log("resize:", width, height);
    if (camera.value === null) {
        console.log("creating camera")  
        camera.value = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.value.position.z = 5;
    };
    //renderer.setSize(width, height);
    camera.value.aspect = width / height;
    //camera.value.updateProjectionMatrix();
};



onMounted(async () => {
    imuContainer.value = imuDisplay.value.parentElement;

    engine.value = new BABYLON.Engine(imuDisplay.value, true);

    scene.value = createScene();
    console.log("scene created",scene.value)

    engine.value.runRenderLoop(() => {
    scene.value.render();
    });


    window.addEventListener('resize', handleResize);

    await nextTick();
    handleResize()

    // Simulate an orientation update
    updateOrientation(imuData.value);
    // start data emulation
    //startEmu()

    // initial resize
    await new Promise(resolve => setTimeout(resolve, 100));
    await nextTick();
    handleResize()


});

onUnmounted(() => {
  if (engine.value) {
    engine.value.dispose();
  }
  window.removeEventListener('resize', handleResize);
  if (t.value) {
    clearInterval(t.value);
    t.value = null
  }
});

// ----------


const engine = ref(null)
const scene = ref(null)
const camera = ref(null)
const light = ref(null)
const box = ref(null)

const createScene = () => {
    const scn = new BABYLON.Scene(engine.value);
    scn.clearColor = BABYLON.Color3.White();

    camera.value = new BABYLON.ArcRotateCamera("camera", 
        Math.PI / 2, Math.PI / 2, 5, 
        new BABYLON.Vector3(0, 0, 5), scene.value);
    camera.value.attachControl(imuDisplay.value, true);

    light.value = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scn);


    box.value = BABYLON.MeshBuilder.CreateBox("box", { size: 2 }, scn);
    box.value.position.z = 5;

    const boxMaterial = new BABYLON.StandardMaterial("boxMat", scn);
    boxMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.5, 0.4);  // Grey color
    boxMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);  // Low specular intensity

    box.value.material = boxMaterial;  // or pbrMaterial for PBR

    const light2 = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scn);
    light2.position = new BABYLON.Vector3(20, 40, 20);

    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light2);
    shadowGenerator.useBlurExponentialShadowMap = true;  // Use blur exponential shadow map for softer shadows
    shadowGenerator.blurKernel = 64;  // Adjust the blur level to soften the shadows

    // Add the box to the list of shadow casters
    shadowGenerator.addShadowCaster(box.value);

    // Enable shadows for the ground or any other receiving surfaces
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 50, height: 50}, scn);
    ground.position.y = -2; // Slightly below zero to avoid z-fighting with the box placed at y = 0
    ground.receiveShadows = true;


    return scn
};


</script>


<template>
    <div class="container">
        <h1>IMU B View</h1>
        <canvas ref="imuDisplay" class="imu"></canvas>
    </div>
</template>


<style scoped>
.container {
    display: block;
    width: 800px;
    height: 600px;
    margin-left:auto;
    margin-right:auto;
    background-color: yellow;
}

@media (max-width: 800px) {
    .container {
    width: 400px;
    height: 300px;
}
}


.imu {
    width: 100%;
    height: 100%;
    background-color: #e0e0e0;
    touch-action: none; /* Disable touch panning and pinch-zooming */
    /* Light grey background */
}
</style>

