<script setup>
import { onMounted, onUnmounted, ref, nextTick, watch } from 'vue';
import * as THREE from 'three';

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




const updateOrientation = (quaternion) => {
    cube.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
}


const startEmu = () => {
    console.log("emu started")
    setInterval(() => {
        /*
        imuData.value.x += 0.01;
        imuData.value.y += 0.01;
        imuData.value.z += 0.01;
        */
        const { roll, pitch} = calculateOrientation(imuAcc.value.x, imuAcc.value.y, imuAcc.value.z);
        imuData.value = eulerToQuaternion(roll, pitch);
        imuAcc.value.x = Math.random() * 2 - 1;
        imuAcc.value.y = Math.random() * 2 - 1;;
        imuAcc.value.z = Math.random() * 2 - 1;;
        updateOrientation(imuData.value);
    }, 300);
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



const scene = new THREE.Scene();
const camera = ref(null)
//const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
//imuDisplay.value.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera.value);
}


const handleResize = () => {
    const width = imuContainer.value.clientWidth;
    const height = imuContainer.value.clientHeight;
    console.log("resize:", width, height);
    if (camera.value === null) {
        console.log("creating camera")  
        camera.value = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.value.position.z = 5;
    };
    renderer.setSize(width, height);
    camera.value.aspect = width / height;
    camera.value.updateProjectionMatrix();
};


// Cleanup on component unmount
onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});



onMounted(async () => {
    imuContainer.value = imuDisplay.value.parentElement;
    imuDisplay.value.appendChild(renderer.domElement);

    window.addEventListener('resize', handleResize);

    await nextTick();
    handleResize()

    // Simulate an orientation update
    updateOrientation(imuData.value);
    // start data emulation
    //startEmu()

    animate();

    // initial resize
    await new Promise(resolve => setTimeout(resolve, 100));
    await nextTick();
    handleResize()


});


</script>

<template>
    <div class="container">
        <h1>IMU View</h1>
        <div id="imuDisplay" ref="imuDisplay" class="imu"></div>
    </div>
</template>


<style scoped>
.container {
    display: block;
    width: 400px;
    height: 300px;
    margin-left:auto;
    margin-right:auto;
    background-color: yellow;
}

.imu {
    width: 100%;
    height: 100%;
    background-color: #e0e0e0;
    /* Light grey background */
}
</style>

