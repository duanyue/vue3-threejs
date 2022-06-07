import { createApp } from 'vue'
import App from './App.vue'
// 导入router
import router from './router/index'
// 导入pinia
import { createPinia } from 'pinia'
// 导入ElementPlus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)

app.use(router).use(createPinia()).use(ElementPlus).mount('#app')
