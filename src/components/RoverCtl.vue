<template>
    <div class="rover-ctl">
        <div class="bgrid">
            <va-button v-for="button in buttons" :key="button.id" @click="handleClick(button)">
                {{ button.label }}
            </va-button>
        </div>
        <div class="sgrid">
            <va-slider v-for="slider in sliders" :key="slider.id" v-model="slider.value" @change="handleSliderChange(slider.id, slider.value)"></va-slider>
        </div>
        <div class="sgrid">
            <va-checkbox v-for="checkbox in checkboxes" :key="checkbox.id" 
            v-model="checkbox.checked" 
            class="mb-6"
            color="primary"
            checked-icon="fab-github"
            :label="checkbox.label"
            @update:modelValue="handleCheckboxChange(checkbox.id, checkbox.checked)"
            >
        </va-checkbox>
        </div>
    </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue';

const emit = defineEmits(['button-click', 'slider-change', 'checkbox-change']);

const buttons = ref([
    { id: 1, label: 'Button 1' },
    { id: 2, label: 'Button 2' },
    { id: 3, label: 'Button 3' },
    { id: 4, label: 'Button 4' },
    { id: 5, label: 'Button 5' },
    { id: 6, label: 'Button 6' },
    { id: 7, label: 'Button 7' },
    { id: 8, label: 'Button 8' },
    { id: 9, label: 'Button 9' },
]);

const sliders = ref([
    { id: 1, value: 0 },
    { id: 2, value: 0 },
]);

const checkboxes = ref([
    { id: 1, checked: false, label: 'Grip Left'},
    { id: 2, checked: false, label: 'Grip Right'},
]);

const handleClick = (button) => {
    // Handle button click logic here
    console.log(`Button ${button.id} clicked`);
    emit('button-click', button.id);
};

const handleSliderChange = (id, value) => {
    // Handle slider change logic here
    console.log(`Slider ${id} changed to ${value}`);
    emit('slider-change', { id, value });
};

const handleCheckboxChange = (id, checked) => {
    // Handle checkbox change logic here
    console.log(`Checkbox ${id} changed to ${checked}`);
    emit('checkbox-change', { id, checked });
};

</script>

<style scoped>
.rover-ctl {
    max-width: 600px;
    margin-top:1rem;
    margin-bottom:1rem;
    margin-left:auto;
    margin-right:auto;
   
}

.bgrid {
    margin-top:2rem;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 10px;
}
.sgrid {
    margin-top:2rem;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 10px;
}

button {
    width: 100%;
    height: 100px;
}

.va-slider {
    grid-column: span 2;
}

.va-checkbox {
    text-align:center;
    grid-column: span 1;
}
</style>
