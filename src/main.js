import Vue from 'vue';
import sockeio from 'socket.io';
import VueSocketIO from 'vue-socket.io';
import App from './App.vue';
import router from './router';

const SocketInstance = sockeio('http://localhost:3128');

export default {
  SocketInstance,
};

Vue.use(VueSocketIO, SocketInstance);

Vue.config.productionTip = false;

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');
