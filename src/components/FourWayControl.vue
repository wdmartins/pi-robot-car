<template>
    <div class="container">
        <div class="row">
            <div class="col-md-auto p-0 filler">
                <!-- filler                       -->
            </div>
            <div class="col-md-auto p-0"
              @mousedown="move('ArrowUp', true)"
              @mouseup="move('ArrowUp', false)">
                <img class="arrow topDown"
                    v-bind:class="{ 'active' : action.type === type && action.up }"
                    src="../assets/arrow-up-square-fill.svg">
            </div>
            <div class="col-md-auto p-0">
                <!-- filler                       -->
            </div>
        </div>
        <div class="row">
            <div class="col-md-auto p-0"
              @mousedown="move('ArrowLeft', true)"
              @mouseup="move('ArrowLeft', false)">
                <img class="arrow leftRight"
                  v-bind:class="{ 'active' : action.type === type && action.left }"
                  src="../assets/arrow-left-square-fill.svg">
            </div>
            <div class="col-md-auto p-0">
                <img class="arrow leftRight" v-if="type === 'camera'"
                    src="../assets/camera-video.svg" />
                <img class="arrow leftRight" v-else src="../assets/truck.svg" >
            </div>
            <div class="col-md-auto p-0"
              @mousedown="move('ArrowRight', true)"
              @mouseup="move('ArrowRight', false)">
                <img class="arrow leftRight"
                  v-bind:class="{ 'active' : action.type === type && action.right }"
                  src="../assets/arrow-right-square-fill.svg">
            </div>
        </div>
        <div class="row">
            <div class="col-md-auto p-0 filler">
                <!-- filler                       -->
            </div>
            <div class="col-md-auto p-0"
              @mousedown="move('ArrowDown', true)"
              @mouseup="move('ArrowDown', false)">
                <img class="arrow topDown"
                    v-bind:class="{ 'active' : action.type === type && action.down }"
                  src="../assets/arrow-down-square-fill.svg">
            </div>
            <div class="col-md-auto p-0">
                <!-- filler                       -->
            </div>
        </div>
    </div>
</template>
<script>

export default {
  name: 'FourWayControl',
  props: {
    type: String,
    action: Object,
  },
  methods: {
    move(direction, mouseDown) {
      this.$emit('move', direction, mouseDown ? 'down' : 'up', this.type);
    },
  },
};
</script>

<style>
.arrow {
    width: 2em;
    height: 2em;
}
.arrow .topDown {
    margin: 5px 20px 5px 30px;
}

.active {
    background-color: red;
}

.arrow .leftRight {
    margin: 5px 13px;
}
.filler {
    width: 2em;
}
</style>
