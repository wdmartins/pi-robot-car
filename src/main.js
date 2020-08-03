import Vue from 'vue';
import sockeio from 'socket.io-client';
import VueSocketIO from 'vue-socket.io';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import App from './App.vue';
import router from './router';

// Install BootstrapVue
Vue.use(BootstrapVue);
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);

// Add websockets to Vue components
Vue.use(new VueSocketIO({
  debug: true,
  connection: sockeio('http://192.168.1.187:3128', {
    transports: ['websocket'],
  }),
}));

Vue.config.productionTip = false;

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');
