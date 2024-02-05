<template>
    <h1>Exiting</h1>
</template>
  
<script setup lang="js">
import { useModal } from 'vuestic-ui'

const { confirm } = useModal()
const show = async () => {
    const exit = await confirm({
        fullscreen: true,
        message: 'Confirm exit',
        title: 'Really exit?',
        okText: "Yes",
        cancelText: "No",
    })
    if (exit) {
        alert('Exiting now')
        return true
    } else {
        console.log("cancelled")
        return false
    }
}

defineExpose({
    show
})


</script>

