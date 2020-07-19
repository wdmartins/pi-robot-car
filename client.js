'use strict';

//-------------------------------------------------------------------------------------------------------
// Vue.js setup
//-------------------------------------------------------------------------------------------------------
let app;
const data = {
    speechRecognitionResult: {
        label: '',
        confidence: ''
    }
}
app = new Vue({
    el: "#app",
    data
});

//-------------------------------------------------------------------------------------------------------
// Instatiate a websocket object 
//-------------------------------------------------------------------------------------------------------
const socket = io({
    transports: ['websocket']
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
    app.speechRecognitionResult = result;
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