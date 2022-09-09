import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'
import Vueaxios from 'vue-axios'
import elementplus from 'element-plus'
import 'element-plus//theme-chalk//index.css' //引用安装包文件需要双引号
import './assets/css/global.css'
import 'cesium/Widgets/widgets.css'

const app=createApp(App)
app.use(store).use(router).use(elementplus,Vueaxios,axios).mount('#app')

app.config.globalProperties.$axios = axios //全局挂在axios
