<template>
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
    return exit
}

defineExpose({
    show
})


</script>

