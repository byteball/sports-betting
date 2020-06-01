import '@babel/polyfill'
import 'mutationobserver-shim'
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import feather from 'vue-icon'

import axios from 'axios'
import VueAxios from 'vue-axios'

import "@/assets/custom.scss"
import i18n from './i18n'
import store from './store'

import Buefy from 'buefy'

Vue.use(Buefy);
Vue.use(VueAxios, axios);
Vue.use(feather, 'v-icon');

Vue.config.productionTip = false;

new Vue({
    el: '#app',
    router,
    i18n,
    store,
    render: h => h(App)
})