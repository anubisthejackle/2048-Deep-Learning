import Vue from 'vue'
import Vue2TouchEvents from 'vue2-touch-events'
import App from './App.vue'

import '@/assets/css/tailwind.css'

Vue.config.productionTip = false
Vue.use(Vue2TouchEvents, {
    swipeTolerance: 90
});
new Vue({
  render: h => h(App),
}).$mount('#app')
