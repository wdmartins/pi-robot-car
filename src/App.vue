<template>
  <div id="app">
    <div id="nav" :hidden="true">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view/>
  </div>
</template>

<script>

//-------------------------------------------------------------------------------------------------
// Command Functions
//-------------------------------------------------------------------------------------------------
const STOP = 'stop';
const FORWARD = 'forward';
const BACKWARD = 'backward';
const TURN_RIGHT = 'turn_right';
const TURN_LEFT = 'turn_left';
const SPEED_UP = 'speed_up';
const SPEED_DOWN = 'speed_down';
const HONK = 'honk';
const LEFT = 'left';
const RIGHT = 'right';
const UP = 'up';
const DOWN = 'down';

const COMMANDS = {
  STOP,
  FORWARD,
  BACKWARD,
  TURN_RIGHT,
  TURN_LEFT,
  SPEED_UP,
  SPEED_DOWN,
  HONK,
  LEFT,
  RIGHT,
  UP,
  DOWN,
};

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

const addSocketEventListeners = function (app) {
  app.sockets.listener.subscribe('connect', app.onSocketConnected);
  app.sockets.listener.subscribe('PONG', app.onPong);
  app.sockets.listener.subscribe('disconnect', app.onSocketDisconnected);
};

const addWindowEventListeners = (app) => {
  window.addEventListener('keydown', app.onKeyDown);
  window.addEventListener('keyup', app.onKeyUp);
};

const mounted = function () {
  addWindowEventListeners(this);
  addSocketEventListeners(this);
};

export default {
  name: 'app',
  mounted,
  data: () => ({
    ping: 0,
    pingInterval: null,
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
        && !KEY_TO_COMMAND_MAP[eventKey]) {
        console.log('Not a valid key');
        return;
      }

      const command = {
        command: 'stop',
        confidence: 1,
      };

      if (shiftKey || !KEY_TO_RUN_COMMAND_MAP[eventKey] || eventType !== KEY_EVENT_TYPE.UP) {
        command.command = shiftKey ? KEY_TO_CAM_COMMAND_MAP[eventKey]
          : KEY_TO_RUN_COMMAND_MAP[eventKey] || KEY_TO_COMMAND_MAP[eventKey];
      }
      console.log('Sending command: ', command);
      this.$socket.emit('command', command);
    },
    onSocketConnected() {
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }

      // Start pinging the server every 10 seconds
      this.pingInterval = setInterval(() => {
        console.log(`Sending PING ${this.ping}`);
        this.$socket.emit('PING', {
          ping: this.ping,
        });
        this.ping += 1;
      }, 10000);
    },
    onPong() {
    },
    onSocketDisconnected() {
    },
  },
};

</script>
<style>
[v-cloak] {display: none; }

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
