<template>
  <div class="home">
    <!-- <img alt="Vue logo" src="../assets/logo.png"> -->
    <TopBar msg="Raspberry PI Robot Car"/>
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue';
import TopBar from '@/components/TopBar.vue';

export default {
  name: 'Home',
  components: {
    TopBar,
    HelloWorld,
  },
};
</script>
