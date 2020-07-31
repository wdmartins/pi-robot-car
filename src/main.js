import Vue from 'vue';
import sockeio from 'socket.io-client';
import VueSocketIO from 'vue-socket.io';
import App from './App.vue';
import router from './router';

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
