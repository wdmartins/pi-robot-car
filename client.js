'use strict';
//-------------------------------------------------------------------------------------------------------
// Instatiate a websocket object 
//-------------------------------------------------------------------------------------------------------
const socket = io({
    transports: ['websocket']
});

//-------------------------------------------------------------------------------------------------------
// Command Functions
//-------------------------------------------------------------------------------------------------------
const KEY_EVENT_TYPE = {
    DOWN: 'down',
    UP: 'up'
};
const COMMANDS = {
    STOP: 'stop',
    FORWARD: 'forward',
    BACKWARD: 'backward',
    TURN_RIGHT: 'turn-right',
    TURN_LEFT: 'turn-left',
    SPEED_UP: 'speed-up',
    SPEED_DOWN: 'speed-down',
    HONK: 'honk',
    LEFT: 'left',
    RIGHT: 'right',
    UP: 'up',
    DOWN: 'down'
};
const KEY_TO_RUN_COMMAND_MAP = {
    'ArrowUp' : COMMANDS.FORWARD,
    'ArrowDown': COMMANDS.BACKWARD,
    'ArrowLeft': COMMANDS.TURN_LEFT,
    'ArrowRight': COMMANDS.TURN_RIGHT
};

const KEY_TO_COMMAND_MAP = {
    'Enter': COMMANDS.HONK,
    'a': COMMANDS.SPEED_UP,
    'z': COMMANDS.SPEED_DOWN
};

const KEY_TO_CAM_COMMAND_MAP = {
    'ArrowUp' : COMMANDS.UP,
    'ArrowDown': COMMANDS.DOWN,
    'ArrowLeft': COMMANDS.LEFT,
    'ArrowRight': COMMANDS.RIGHT
}
function processKeyEvent(type, key, shift) {
    if (!KEY_TO_RUN_COMMAND_MAP[key] && !KEY_TO_CAM_COMMAND_MAP[key] && !KEY_TO_COMMAND_MAP[key]) {
        console.log('Not a valid key');
        return;
    }
    const command = {
        command: 'stop',
        confidence: 1
    }
    if (!shift && KEY_TO_RUN_COMMAND_MAP[key] && type === KEY_EVENT_TYPE.UP) {
        // Stop running. Default command.
    } else {
        if (shift) {
            command.command = KEY_TO_CAM_COMMAND_MAP[key];
        } else {
            command.command = KEY_TO_RUN_COMMAND_MAP[key] || KEY_TO_COMMAND_MAP[key];
        }
    }
    console.log('Sending command: ', command);
    socket.emit('command', command);
}
//-------------------------------------------------------------------------------------------------------
// Vue.js setup
//-------------------------------------------------------------------------------------------------------
let app;
const data = {
    speechRecognitionResult: {
        label: '',
        confidence: ''
    }
};
const methods = {
    updateSpeechRecognitionResults: function(results) {
        this.speechRecognitionResult = results;
    }
}
const mounted = function () {
    window.addEventListener('keydown', function (evt) {
        console.log(`Key event: down ${evt.shiftKey ? 'Shift-' : ''}${evt.key}`);
        processKeyEvent(KEY_EVENT_TYPE.DOWN, evt.key, evt.shiftKey);
    });
    window.addEventListener('keyup', function (evt) {
        console.log(`Key event: up ${evt.shiftKey ? 'Shift-' : ''}${evt.key}`);
        processKeyEvent(KEY_EVENT_TYPE.UP, evt.key, evt.shiftKey);
    });
};
app = new Vue({
    el: "#app",
    data,
    methods,
    mounted
});

//-------------------------------------------------------------------------------------------------------
// Speech Recognition handling
//-------------------------------------------------------------------------------------------------------

// Process results from ml5 sound recognition
function gotResult(error, results) {
    // Display error in the console
    if (error) {
      console.error(error);
    }
    // The results are in an array ordered by confidence.
    const result = {
      label: results[0].label,
      confidence: results[0].confidence.toFixed(4)
    };

    const command = {
        command: result.label,
        confidence: result.confidence
    };
    socket.emit('command', command);
    
    console.log('Send command: ', command);
    app.updateSpeechRecognitionResults(results[0]);
    // app.speechRecognitionResult = result;
}

// Setup ml5
async function setup() {
    // Initialize a sound classifier method with SpeechCommands18w model. A callback needs to be passed.
    const options = { probabilityThreshold: 0.97 };
    const classifier = await ml5.soundClassifier('SpeechCommands18w', options);
  
    // Classify the sound from microphone in real time
    classifier.classify(gotResult);
}
setup();

//-------------------------------------------------------------------------------------------------------
// WebSocket Handling
//-------------------------------------------------------------------------------------------------------
let interval;
let ping = 0;

// Register for socket reconnection attempt
socket.on('reconnect_attempt', () => {
  socket.io.opts.transports = ['polling', 'websocket'];
});

// Register for sockect connection
socket.on('connect', function() {
    console.log('Connected');
    if (interval) {
        clearInterval(interval);
        interval = null;
    }

    // Start pinging the server every 10 seconds
    interval = setInterval(() => {
        console.log(`Sending PING ${ping}`);
        socket.emit('PING', {
            ping: ping++
        });
    }, 10000);
});

// Register for ping from the server
socket.on('PONG', (data) => {
    console.log(`Received PONG ${data.pong}`);
});

// Register for event received from the server
socket.on('event', function(data) {
    console.log('Data');
});

// Register for socket disconnection
socket.on('disconnect', function() {
    if (interval) {
        clearInterval(interval);
        interval = null;
        ping = 0;
    }
    console.log('Disconnected')
});