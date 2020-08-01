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

const COMMAND_TYPE = {
  DRIVE: 'drive',
  CAMERA: 'camera',
  BEEPER: 'beeper',
};

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
const DRIVE_COMMAND = {
  STOP,
  FORWARD,
  BACKWARD,
  TURN_RIGHT,
  TURN_LEFT,
};
const CAMERA_COMMAND = {
  LEFT,
  RIGHT,
  UP,
  DOWN,
};
const BEEPER_COMMAND = {
  HONK,
};

exports.COMMANDS = COMMANDS;
exports.DRIVE_COMMAND = DRIVE_COMMAND;
exports.CAMERA_COMMAND = CAMERA_COMMAND;
exports.BEEPER_COMMAND = BEEPER_COMMAND;
exports.COMMAND_TYPE = COMMAND_TYPE;
