<template>
  <div class="row">
    <!-- Filler for now -->
    <div class="col-4">
        filler
    </div>
    <!-- Camera control -->
    <div class="col-4">
        <FourWayControl type="camera"/>
    </div>
    <!-- Drive control -->
    <div class="col-4">
        <FourWayControl type="truck"/>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import FourWayControl from '@/components/FourWayControl.vue';

export default {
  name: 'BottomBar',
  components: {
    FourWayControl,
  },
};
</script>
