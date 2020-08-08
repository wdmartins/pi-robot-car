<template>
  <div class="text-left row">
    <div class="col-md-auto pl-5">
      <div class="label">Beeper:
        <span class="value">{{beeperStatus}}</span>
      </div>
      <div class="label">LED:
        <span class="value">{{ledStatus}}</span>
      </div>
      <div class="label">Echo:
        <span class="value">{{echoStatus}} cm</span>
      </div>
    </div>
    <div class="col-md-auto">
      <div class="label">Camera:
        <span class="value">On</span>
      </div>
      <div class="label">Horizontal:
        <span class="value">{{horizontalStatus}}</span>
      </div>
      <div class="label">vertical:
        <span class="value">{{verticalStatus}}</span>
      </div>
    </div>
    <div class="col-md-auto">
      <div class="label">Speed:
        <span class="value">{{currentSpeedStatus}}/{{setSpeedStatus}}</span>
      </div>
      <div class="label">Direction:
        <span class="value">{{directionStatus}}</span>
      </div>
      <div class="label">Deviation:
        <span class="value">{{deviationStatus}}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { STATUS_KEYS } from '../../common/common';

export default {
  name: 'InformationBar',
  data: () => ({
    beeperStatus: 'Unknown',
    ledStatus: 'Unknown',
    echoStatus: 'Unknown',
    cameraStatus: 'On',
    horizontalStatus: 'Unknown',
    verticalStatus: 'Unknown',
    speedStatus: 'Unknown',
    directionStatus: 'Unknown',
    deviationStatus: 'Unknown',
  }),
  mounted() {
    this.sockets.listener.subscribe('STATUS', this.onStatus);
  },
  methods: {
    onStatus(status) {
      this.beeperStatus = status[STATUS_KEYS.BEEPER_STATUS] ? 'On' : 'Off';
      this.ledStatus = `Red ${status[STATUS_KEYS.LED_STATUS].green}, Green: ${status[STATUS_KEYS.LED_STATUS].red}, Blue: ${status[STATUS_KEYS.LED_STATUS].blue}`;
      this.echoStatus = status[STATUS_KEYS.ECHO_STATUS];
      this.horizontalStatus = status[STATUS_KEYS.CAMERA_STATUS].vertical;
      this.verticalStatus = status[STATUS_KEYS.CAMERA_STATUS].horizontal;
      this.deviationStatus = status[STATUS_KEYS.CAR_DEVIATION];
      this.currentSpeedStatus = status[STATUS_KEYS.CAR_MOVEMENT][STATUS_KEYS.CAR_CURRENT_SPEED];
      this.setSpeedStatus = status[STATUS_KEYS.CAR_MOVEMENT][STATUS_KEYS.CAR_SET_SPEED];
      this.directionStatus = status[STATUS_KEYS.CAR_MOVEMENT][STATUS_KEYS.CAR_DIRECTION];
      console.log(status);
    },
  },
};
</script>

<style>
.label {
  font-family: 'Courier New', Courier, monospace;
}
.value {
  font-family: 'Courier New', Courier, monospace;
}
</style>
