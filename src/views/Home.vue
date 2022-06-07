<script setup lang="ts">
import { ref } from 'vue'
import Three from '../components/Three.vue'


const activeIndex = ref('1')
const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>
<template>
    <div class="common-layout">
        <div>
            <div class="header">
                <el-menu
                    :default-active="activeIndex"
                    class="el-menu-demo"
                    mode="horizontal"
                    background-color="#545c64"
                    text-color="#fff"
                    active-text-color="#ffd04b"
                    @select="handleSelect">
                    <el-menu-item index="1">Three.js</el-menu-item>
                </el-menu>
            </div>
            <div class="main">
                <Three />
            </div>
        </div>
    </div>
</template>
<style scoped>
.main{
    padding: 0 20px;
    background-color: #333;
}
</style>
