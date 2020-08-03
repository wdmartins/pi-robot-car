<template>
  <div class="row camera">
    <img src="http://192.168.1.187:8081?action=stream" />
  </div>
</template>

<style>
.camera {
  width: 100vw;
  height: 100vh;
  max-width: 100%;
  position: absolute;
  z-index: 2;
}
img {
  max-width: 100%;
  height: auto;
  max-height: 100%;
}
</style>
