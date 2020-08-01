<template>
  <div class="row">
    <!-- Filler for now -->
    <div class="col-4">
        filler
    </div>
    <!-- Camera control -->
    <div class="col-4">
        <FourWayControl type="camera" :action="action"/>
    </div>
    <!-- Drive control -->
    <div class="col-4">
        <FourWayControl type="drive" :action="action"/>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import FourWayControl from '@/components/FourWayControl.vue';
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
      this.action = setAction(evt.key, evt.shiftKey);
    },
    onKeyUp(evt) {
      this.onKeyEvent(KEY_EVENT_TYPE.UP, evt.key, evt.shiftKey);
      this.action = clearAction();
    },
    onKeyEvent(eventType, eventKey, shiftKey) {
      console.log(`Key event: ${eventType} ${shiftKey ? 'Shift-' : ''}${eventKey}`);

      if (!KEY_TO_RUN_COMMAND_MAP[eventKey] && !KEY_TO_CAM_COMMAND_MAP[eventKey]
        && !KEY_TO_COMMAND_MAP[eventKey]) {
        console.log('Not a valid key');
        return;
      }

      const command = {
        confidence: 1,
      };

      if (shiftKey || !KEY_TO_RUN_COMMAND_MAP[eventKey] || eventType !== KEY_EVENT_TYPE.UP) {
        command.command = shiftKey ? KEY_TO_CAM_COMMAND_MAP[eventKey]
          : KEY_TO_RUN_COMMAND_MAP[eventKey] || KEY_TO_COMMAND_MAP[eventKey];
        this.action.command = command.command;
      } else {
        command.command = COMMANDS.STOP;
      }
      this.$socket.emit('command', command);
    },
    onSocketConnected() {
    },
    onSocketDisconnected() {
    },
  },
};
</script>
