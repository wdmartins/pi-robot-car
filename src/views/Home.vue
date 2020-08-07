<template>
  <main role="main">
    <div class="container-fluid p-1 m-0 row border">
      <VideoCamera class="col"/>
      <ControlBar class="col-md-auto p-1 border"/>
    </div>
    <div class="container-fluid p-1 m-0 row border">
      <InformationBar />
    </div>
  </main>
</template>

<script>
// @ is an alias to /src
import ControlBar from '@/components/ControlBar.vue';
import VideoCamera from '@/components/VideoCamera.vue';
import InformationBar from '@/components/InformationBar.vue';

export default {
  name: 'Home',
  components: {
    ControlBar,
    VideoCamera,
    InformationBar,
  },
};
</script>
<style>
html {
  background-color: rgb(159, 186, 204);
}
</style>
