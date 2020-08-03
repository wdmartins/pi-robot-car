<template>
  <div id="app">
    <!-- <div id="nav" :hidden="true"> -->
      <!-- <router-link to="/">Home</router-link> | -->
      <!-- <router-link to="/about">About</router-link> -->
    <!-- </div> -->
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'app',
};
</script>

<style>
[v-cloak] {display: none; }
/* html, body {margin: 0; height: 100%; overflow: hidden} */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
