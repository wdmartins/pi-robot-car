<template>
  <div class="home">
  <main role="main" class="col p-0 main">
    <VideoCamera/>
    <ControlBar/>
  </main>
  </div>
</template>

<script>
// @ is an alias to /src
import ControlBar from '@/components/ControlBar.vue';
import VideoCamera from '@/components/VideoCamera.vue';

export default {
  name: 'Home',
  components: {
    ControlBar,
    VideoCamera,
  },
};
</script>
<style>
.main {
  position: relative;
  z-index: 1;
}
</style>
