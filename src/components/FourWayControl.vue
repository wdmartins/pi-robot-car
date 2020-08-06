<template>
    <div class="container mx-auto">
        <div class="row m-2 p-1">
            <div class="col mx-auto">
                <img class="arrow"
                    @mousedown="move('ArrowUp', true)"
                    @mouseup="move('ArrowUp', false)"
                    v-bind:class="{ 'active' : action.type === type && action.up }"
                    src="../assets/arrow-up-square-fill.svg" />
            </div>
        </div>
        <div class="row">
            <div class="col p-0 mx-auto>">
                <img class="arrow leftRight"
                  @mousedown="move('ArrowLeft', true)"
                  @mouseup="move('ArrowLeft', false)"
                  v-bind:class="{ 'active' : action.type === type && action.left }"
                  src="../assets/arrow-left-square-fill.svg" />
            </div>
            <div class="col p-0 mx-auto>">
                <img class="arrow leftRight" v-if="type === 'camera'"
                    src="../assets/camera.svg" />
                <img class="arrow leftRight" v-else src="../assets/truck.svg" />
            </div>
            <div class="col p-0 mx-auto>">
                <img class="arrow leftRight"
                  @mousedown="move('ArrowRight', true)"
                  @mouseup="move('ArrowRight', false)"
                  v-bind:class="{ 'active' : action.type === type && action.right }"
                  src="../assets/arrow-right-square-fill.svg" />
            </div>
        </div>
        <div class="row m-2 p-1">
            <div class="col mx-auto">
                <img class="arrow"
                  @mousedown="move('ArrowDown', true)"
                  @mouseup="move('ArrowDown', false)"
                  v-bind:class="{ 'active' : action.type === type && action.down }"
                  src="../assets/arrow-down-square-fill.svg" />
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
    cursor: pointer;
}
.active {
    background-color: red;
}
</style>
