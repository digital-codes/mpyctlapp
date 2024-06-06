<template>
    <vue-echarts :option="options" class="chart" ref="simpleChart" />
</template>
  
<script setup lang="js">

import { onMounted, onUnmounted, ref } from "vue"
import { VueEcharts } from 'vue3-echarts';

const simpleChart = ref()

const dataX = ref([0])
const data1 = ref([1])
const data2 = ref([2])
const data3 = ref([3])


const options = ref({
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        }
    },
    legend: {},
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
    },
    xAxis: [
        {
            type: 'value',
            data: dataX
        }
    ],
    yAxis: [
        {
            type: 'value'
        }
    ],
    series: [
        {
            name: 'Sector1',
            type: 'bar',
            stack: 'KA1',
            emphasis: {
                focus: 'series'
            },
            data: data1
        },
        {
            name: 'Sector2',
            type: 'line',
            stack: 'KA2',
            emphasis: {
                focus: 'series'
            },
            data: data2
        },
        {
            name: 'Sector3',
            type: 'bar',
            stack: 'KA3',
            emphasis: {
                focus: 'series'
            },
            data: data3
        },
    ]
})


const pushData = async (dt) => {
    const items = dataX.value.length
    dataX.value.push(items + 1)
    data1.value.push(dt)
    data2.value.push(dt + 1)
    data3.value.push(dt - 1)
    if (items > 10) {
        dataX.value.shift()
        data1.value.shift()
        data2.value.shift()
        data3.value.shift()
    }
    await simpleChart.value.setOption(options.value)
}

const t = ref(null)

onMounted(() => {
    if (simpleChart.value) {
        console.log("SimpleChart mounted")
        t.value = setInterval(() => {
        if (simpleChart.value) pushData(Math.random());
        }, 200);
    } else {
        console.log("SimpleChart not mounted")
    }
})

onUnmounted(() => {
    if (t.value !== null) {
        clearInterval(t.value)
        t.value = null
    }
})

</script>

<style scoped>
.chart {
    /*height:400px;*/
    /*
    height: 300px;
    max-width: 80%;
    */
    height:100%;
    width:100%;
    min-height: 250px;
    margin-left: auto;
    margin-right: auto;
}

</style>