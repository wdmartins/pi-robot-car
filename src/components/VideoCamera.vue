<template>
  <div class="camera">
    <img :src="videoUrl"/>
  </div>
</template>

<script>
export default {
  data: () => ({
    videoUrl: null,
  }),
  mounted() {
    this.videoUrl = `${process.env.VUE_APP_ROOT_API}/video/?action=stream`;
  }
};
</script>
<style>
img {
  max-width: 100%;
}
</style>
