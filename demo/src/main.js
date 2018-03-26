// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import AsyncMethods from 'vue-async-methods'
import VueVuelidateJsonschema from 'vue-vuelidate-jsonschema'
import Vuelidate from 'vuelidate'

Vue.use(VueVuelidateJsonschema)
Vue.use(Vuelidate)

Vue.config.productionTip = false
Vue.use(AsyncMethods, {
  createComputed: true
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
