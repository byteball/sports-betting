import '@babel/polyfill'
import 'mutationobserver-shim'
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import '@mdi/font/css/materialdesignicons.css'

import axios from 'axios'
import VueAxios from 'vue-axios'

import "@/assets/custom.scss"
import i18n from './i18n'

import Buefy from 'buefy'

Vue.use(Buefy);
Vue.use(VueAxios, axios);

Vue.config.productionTip = false;

new Vue({
    el: '#app',
    router,
    i18n,
   // store,
    render: h => h(App)
})