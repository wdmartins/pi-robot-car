'use strict';

function initUI (onCallUserCb, onSearchStringUpdated, onTranscriptionStarted) {
    app = new Vue({
        el: "#app",
        methods: {
            placeholder: function() {
            },
            setAudioSource: function (source) {
                this.audioElement.srcObject = source;
            }
        },
        data: {
            title: 'Title',
            date: '',
            time: '',
        }
    });
    return;
}
initUI();
console.log('ml5 version:', ml5.version);
// Initialize a sound classifier method with SpeechCommands18w model. A callback needs to be passed.
let classifier;
// Options for the SpeechCommands18w model, the default probabilityThreshold is 0
const options = { probabilityThreshold: 0.97 };
// Two variable to hold the label and confidence of the result
let label;
let confidence;



async function setup() {
  classifier = await ml5.soundClassifier('SpeechCommands18w', options);
  // Create 'label' and 'confidence' div to hold results
  
  label = document.createElement('DIV');
  label.textContent = 'label ...';
  confidence = document.createElement('DIV');
  confidence.textContent = 'Confidence ...';

  document.body.appendChild(label);
  document.body.appendChild(confidence);
  // Classify the sound from microphone in real time
  classifier.classify(gotResult);
}
setup();


// A function to run when we get any errors and the results
// var socket = io('https://pi-robot-car.duckdns.org');
var socket = io({
  transports: ['websocket']
});
var interval;
var ping = 0;
function gotResult(error, results) {
  // Display error in the console
  if (error) {
    console.error(error);
  }
  // The results are in an array ordered by confidence.
  //console.log(results);
  // Show the first label and confidence
  label.textContent = 'Label: ' + results[0].label;
  confidence.textContent = 'Confidence: ' + results[0].confidence.toFixed(4);
  socket.emit('command', {
    command: label.textContent,
    confidence: confidence.textContent
  });
  console.log(`Send command: ${label.textContent}`);
}
socket.on('reconnect_attempt', () => {
  socket.io.opts.transports = ['polling', 'websocket'];
});
socket.on('connect', function() {
  console.log('Connected');
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  interval = setInterval(() => {
    console.log(`Sending PING ${ping}`);
    socket.emit('PING', {
      ping: ping++
    });
  }, 10000);
});
socket.on('PONG', (data) => {
  console.log(`Received PONG ${data.pong}`);
});
socket.on('event', function(data) {
  console.log('Data');
});
socket.on('info', function(data) {
  console.log(`Info received: ${data}`);
});
socket.on('pong', () => {
  console.log('Pong received -----');
});

socket.on('disconnect', function() {
  if (interval) {
    clearInterval(interval);
    interval = null;
    ping = 0;
  }
  console.log('Disconnected')
});