<template>
  <div>
    <!-- Filler for now -->
    <div class="col">
      <h5>Control Panel</h5>
    </div>
    <!-- Camera control -->
    <div class="col">
        <FourWayControl @move="move" type="camera" :action="action"/>
    </div>
    <!-- Drive control -->
    <div class="col">
        <FourWayControl @move="move" type="drive" :action="action"/>
    </div>
    <!-- Miscellaneous Controls -->
    <div class="col mt-3">
      <div class="row">
        <!-- Speed Control -->
        <h6 class="col p-0 mx-auto">Speed
          <div class="col mx-auto">
            <img class="control-img" src="../assets/plus-square-fill.svg" />
          </div>
          <div class="col mx-auto">
            <img class="control-img" src="../assets/dash-square-fill.svg" />
          </div>
        </h6>
        <!-- Honk the horn -->
        <h6 class="col p-0 mx-auto">Horn
          <div class="col mx-auto">
            <img class="control-img" src="../assets/volume-up-fill.svg" />
          </div>
        </h6>
        <!-- Flash lights -->
        <h6 class="col p-0 mx-auto">Flash
          <div class="col mx-auto">
            <img class="control-img" src="../assets/lightning-fill.svg" />
          </div>
        </h6>
      </div>
    </div>
    <!-- Enable Obstacle Avoidance -->
    <div class="col mt-3">
        <Toggle @toggle="toggle" command="automatic" label="Automatic"/>
    </div>
    <!-- Line Tracking -->
    <div class="col">
        <Toggle @toggle="toggle" command="line" label="Line Tracking"/>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import FourWayControl from '@/components/FourWayControl.vue';
import Toggle from '@/components/Toggle.vue';
import { COMMANDS, COMMAND_TYPE } from '../../common/common';

const KEY_EVENT_TYPE = {
  DOWN: 'down',
  UP: 'up',
};

const KEY_TO_RUN_COMMAND_MAP = {
  ArrowUp: COMMANDS.FORWARD,
  ArrowDown: COMMANDS.BACKWARD,
  ArrowLeft: COMMANDS.TURN_LEFT,
  ArrowRight: COMMANDS.TURN_RIGHT,
};

const KEY_TO_COMMAND_MAP = {
  Enter: COMMANDS.HONK,
  a: COMMANDS.SPEED_UP,
  z: COMMANDS.SPEED_DOWN,
};

const KEY_TO_CAM_COMMAND_MAP = {
  ArrowUp: COMMANDS.UP,
  ArrowDown: COMMANDS.DOWN,
  ArrowLeft: COMMANDS.LEFT,
  ArrowRight: COMMANDS.RIGHT,
};

const addSocketEventListeners = (app) => {
  app.sockets.listener.subscribe('connect', app.onSocketConnected);
  app.sockets.listener.subscribe('disconnect', app.onSocketDisconnected);
};

const addWindowEventListeners = (app) => {
  window.addEventListener('keydown', app.onKeyDown);
  window.addEventListener('keyup', app.onKeyUp);
};

const clearAction = () => ({
  up: false,
  down: false,
  left: false,
  right: false,
});

const setAction = (key, shiftKey) => ({
  up: key === 'ArrowUp',
  down: key === 'ArrowDown',
  left: key === 'ArrowLeft',
  right: key === 'ArrowRight',
  type: shiftKey ? COMMAND_TYPE.CAMERA : COMMAND_TYPE.DRIVE,
});

export default {
  name: 'BottomBar',
  components: {
    FourWayControl,
    Toggle,
  },
  mounted() {
    addWindowEventListeners(this);
    addSocketEventListeners(this);
  },
  data: () => ({
    ping: 0,
    pingInterval: null,
    action: {},
  }),
  methods: {
    onKeyDown(evt) {
      this.onKeyEvent(KEY_EVENT_TYPE.DOWN, evt.key, evt.shiftKey);
    },
    onKeyUp(evt) {
      this.onKeyEvent(KEY_EVENT_TYPE.UP, evt.key, evt.shiftKey);
    },
    onKeyEvent(eventType, eventKey, shiftKey) {
      console.log(`Key event: ${eventType} ${shiftKey ? 'Shift-' : ''}${eventKey}`);

      if (!KEY_TO_RUN_COMMAND_MAP[eventKey] && !KEY_TO_CAM_COMMAND_MAP[eventKey]
        && (!KEY_TO_COMMAND_MAP[eventKey] || eventType === KEY_EVENT_TYPE.UP)) {
        // Key has no associated action
        return;
      }

      // Set action to update UI
      this.action = eventType === KEY_EVENT_TYPE.UP ? clearAction() : setAction(eventKey, shiftKey);

      // Set command to send to server
      let command = COMMANDS.STOP;

      if (shiftKey || !KEY_TO_RUN_COMMAND_MAP[eventKey] || eventType !== KEY_EVENT_TYPE.UP) {
        command = shiftKey ? KEY_TO_CAM_COMMAND_MAP[eventKey]
          : KEY_TO_RUN_COMMAND_MAP[eventKey] || KEY_TO_COMMAND_MAP[eventKey];
      }
      this.sendCommand(command, 1);
    },
    sendCommand(command, confidence) {
      this.$socket.emit('command', {
        command,
        confidence,
      });
    },
    onSocketConnected() {
    },
    onSocketDisconnected() {
    },
    move(eventKey, eventType, componentType) {
      console.log(`Move event with Direction ${eventKey}, eventType ${eventType} and componentType ${componentType}`);
      this.onKeyEvent(eventType, eventKey, componentType === 'camera');
    },
    toggle(command, status) {
      console.log(`ControlBar: command ${command}, status ${status}`);
      this[command](status);
    },
    automatic(status) {
      console.log(`Automatic mode set to: ${status}`);
    },
    line(status) {
      console.log(`Line Tracking set to: ${status}`);
    },
  },
};
</script>

<style>
.control-img {
  width: 2em;
  height: 2em;
  cursor: pointer;
  margin: 0.2em;
}
.active {
    background-color: red;
}

</style>>
