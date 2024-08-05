import { Motion } from '@capacitor/motion';


const motionHandler = {
    handler: null,
    filterX: [],
    filterY: [],
    filterZ: [],
    filterAlpha: [],
    filterBeta: [],
    filterGamma: [],
    drops: 0,
    dropCnt: 0,
}

const permitMotion = async () => {
    console.log("Mot perm")
    if (!Motion) {
        //console.log("Motion not available")
        document.getElementById("motion").innerText = `Motion not available`
        return;
    }
    if (motionHandler.handler != null) {
        console.log("Motion already started")
        return;
    }
    // check if we can ask for permission
    // android chrome might block sensor access => enable in settings
    if (typeof DeviceOrientationEvent.requestPermission === "function")
        try {
            await DeviceMotionEvent.requestPermission();
            //console.log("Motion permission granted")
            document.getElementById("motion").innerText = "Granted"
        } catch (e) {
            console.log("Error", e)
            // Handle error
            motionHandler.handler = null;
            document.getElementById("motion").innerText = `Permission error`
            return;
        }

    // reset handler
    motionHandler.drops = 0;
    motionHandler.dropCnt = 0;
    motionHandler.filterX = [];
    motionHandler.filterY = [];
    motionHandler.filterZ = [];
    motionHandler.filterAlpha = [];
    motionHandler.filterBeta = [];
    motionHandler.filterGamma = [];

    // Once the user approves, can start listening:
    document.getElementById("motion").innerText = "Starting motion"

    motionHandler.handler = await Motion.addListener('accel', event => {
        const acc = event.accelerationIncludingGravity;
        const rot = event.rotationRate;
        const interval = event.interval;
        const ts = event.timeStamp;
        console.log('Device accel x,y,z,interval,ts:', event,
            acc.x, acc.y, acc.z,
            rot.alpha, rot.beta, rot.gamma,
            interval, ts);
        if (motionHandler.drops == 0) {
            // bluefy on ios has interval in s, not ms
            if (interval > 1) {
                motionHandler.drops = Math.floor(100 / interval) + 1 // drop event
            } else {
                motionHandler.drops = Math.floor(100 / (1000 * interval)) + 1 // drop event
            }
            document.getElementById("motion").innerText = `Intervall: ${interval}`
            motionHandler.dropCnt = 0;
        } else {
            motionHandler.filterX.push(acc.x)
            motionHandler.filterY.push(acc.y)
            motionHandler.filterZ.push(acc.z)
            motionHandler.filterAlpha.push(rot.alpha)
            motionHandler.filterBeta.push(rot.beta)
            motionHandler.filterGamma.push(rot.gamma)
            if (motionHandler.filterX.length > motionHandler.drops) {
                motionHandler.filterX.shift()
                motionHandler.filterY.shift()
                motionHandler.filterZ.shift()
                motionHandler.filterAlpha.shift()
                motionHandler.filterBeta.shift()
                motionHandler.filterGamma.shift()
            }
            motionHandler.dropCnt += 1;
            if (motionHandler.dropCnt >= motionHandler.drops) {
                const x = (motionHandler.filterX.reduce((a, b) => a + b, 0) / motionHandler.drops).toFixed(2);
                const y = (motionHandler.filterY.reduce((a, b) => a + b, 0) / motionHandler.drops).toFixed(2)
                const z = (motionHandler.filterZ.reduce((a, b) => a + b, 0) / motionHandler.drops).toFixed(2)
                const alpha = (motionHandler.filterAlpha.reduce((a, b) => a + b, 0) / motionHandler.drops).toFixed(2)
                const beta = (motionHandler.filterBeta.reduce((a, b) => a + b, 0) / motionHandler.drops).toFixed(2)
                const gamma = (motionHandler.filterGamma.reduce((a, b) => a + b, 0) / motionHandler.drops).toFixed(2)
                document.getElementById("motion").innerText = `${x}, ${y}, ${z}, - ${alpha}, ${beta}, ${gamma}`;
                motionHandler.dropCnt = 0;
            }
        }
        //console.log('Device accel x,y,z,interval,ts:', event, event.acceleration,event.interval,event.timestamp);
    });
    /*
    // Once the user approves, can start listening:
    motionHandler.orient = await Motion.addListener('orientation', event => {
        console.log('Device rot rate:', event, event.alpha, event.beta, event.gamma,event.timestamp);
    });
    */

}

// Stop the acceleration listener
const disableMotion = () => {
    if (motionHandler.handler != null) {
        //console.log("Stop Motion")
        motionHandler.handler.remove();
        motionHandler.handler = null;
        document.getElementById("motion").innerText = "No Motion"
    } else {
        //console.log("Motion not started")
        document.getElementById("motion").innerText = "No Motion started"
    }
};


export {
    permitMotion,
    disableMotion,

}
