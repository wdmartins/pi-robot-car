<template>
  <div class="home">
    <BottomBar/>
  </div>
</template>

<script>
// @ is an alias to /src
import BottomBar from '@/components/BottomBar.vue';

export default {
  name: 'Home',
  components: {
    BottomBar,
  },
};
</script>
