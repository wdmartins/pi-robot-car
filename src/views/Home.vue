<template>
  <div class="home">
    <!-- <img alt="Vue logo" src="../assets/logo.png"> -->
    <div class="container-fluid p-0">
      <!-- Top Navigation bar -->
      <TopBar msg="Raspberry PI Robot Car"/>
      <div class="row m-0">
        <!-- Side Navigation bar -->
        <SideBar class="sidebar col-2 p-0"></SideBar>

        <main role="main" class="col p-0">
          <!-- Camera Stream -->
          <div class="row">
            <img style="max-width: 80%;" class="mx-auto d-block" src="http://192.168.1.187:8081?action=stream" />
          </div>
          <!-- Control Bar -->
          <BottomBar/>
        </main>

        <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue';
import TopBar from '@/components/TopBar.vue';
import SideBar from '@/components/SideBar.vue';
import BottomBar from '@/components/BottomBar.vue';

export default {
  name: 'Home',
  components: {
    BottomBar,
    // HelloWorld,
    SideBar,
    TopBar,
  },
};
</script>
