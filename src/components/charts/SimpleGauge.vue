<template>
    <v-chart class="chart" :option="option" aria-role="meter" ref="theChart" :theme="theme" autoresize />
</template>
  
<script setup lang="js">

import { onMounted, onUnmounted, ref, watch } from "vue"

import VChart from 'vue-echarts';
// echart stuff for vue-echarts
import { CanvasRenderer } from 'echarts/renderers';
//import { PieChart } from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    LegendComponent,
} from 'echarts/components';
import {GaugeChart} from 'echarts/charts';
import { use } from 'echarts/core';

use([
    CanvasRenderer,
    //PieChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GaugeChart,
]);

const props = defineProps({
    value: {
        type: [Number, Array],
        default: 0
    },
    max: {
        type: Number,
        default: 20
    },
    min: {
        type: Number,
        default: -20
    },
    label: {
        type: String,
        required: true
    },
})  

watch (() => props.value, (newVal, oldVal) => {
    //console.log("SimpleGauge value changed from", oldVal, "to", newVal)
    option.value.series[0].data[0].value = newVal
})



const option = ref({
    aria: {
        enabled: true,
        show: true
    },
    /*
    textStyle: {
        fontFamily: "Palanquin",
    },
    */
    title: {
        text: props.label,
        left: "center",
    },
    series: [
        {
            type: 'gauge',
            startAngle: 180,
            endAngle: 0,
            min: props.min,
            max: props.max,
            progress: {
                show: true,
                width: 18
            },
            axisLine: {
                lineStyle: {
                    width: 18
                }
            },
            axisTick: {
                show: false
            },
            splitLine: {
                show:false,
                length: 15,
                lineStyle: {
                    width: 2,
                    color: '#999'
                }
            },
            axisLabel: {
                show:false,
                distance: 25,
                color: '#999',
                fontSize: 20
            },
            anchor: {
                show: true,
                showAbove: true,
                size: 10,
                itemStyle: {
                    borderWidth: 10
                }
            },
            title: {
                show: false
            },
            detail: {
                valueAnimation: false,
                fontSize: 32,
                offsetCenter: [0, '70%']
            },
            data: [
                {
                    value: 70
                }
            ]
        }
    ]
}
)

const theChart = ref(null)
const theme = ref("light")


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
    min-height: 150px;
    margin-left: auto;
    margin-right: auto;
}

</style>