<template>
    <div class="container">
        <div class="row">
            <div class="col-md-auto p-0 filler">
                <!-- filler                       -->
            </div>
            <div class="col-md-auto p-0">
                <img class="arrow topDown" src="../assets/arrow-up-square-fill.svg">
            </div>
            <div class="col-md-auto p-0">
                <!-- filler                       -->
            </div>
        </div>
        <div class="row">
            <div class="col-md-auto p-0">
                <img class="arrow leftRight" src="../assets/arrow-left-square-fill.svg">
            </div>
            <div class="col-md-auto p-0">
                <img class="arrow leftRight" v-if="type === 'camera'"
                    src="../assets/camera-video.svg" />
                <img class="arrow leftRight" v-else src="../assets/truck.svg" >
            </div>
            <div class="col-md-auto p-0">
                <img class="arrow leftRight" src="../assets/arrow-right-square-fill.svg">
            </div>
        </div>
        <div class="row">
            <div class="col-md-auto p-0 filler">
                <!-- filler                       -->
            </div>
            <div class="col-md-auto p-0">
                <img class="arrow topDown" src="../assets/arrow-down-square-fill.svg">
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
.arrow .leftRight {
    margin: 5px 13px;
}
.filler {
    width: 2em;
}
</style>
