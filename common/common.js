/**
 * Commands
 */
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
const FLASH_RED = 'flash_red';
const FLASH_GREEN = 'flash_green';
const FLASH_WHITE = 'flash_white';

const COMMAND_TYPE = {
  DRIVE: 'drive',
  CAMERA: 'camera',
  BEEPER: 'beeper',
  FLASH: 'flash',
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
  FLASH_RED,
  FLASH_GREEN,
  FLASH_WHITE,
};
const DRIVE_COMMAND = {
  STOP,
  FORWARD,
  BACKWARD,
  TURN_RIGHT,
  TURN_LEFT,
  SPEED_UP,
  SPEED_DOWN,
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
const FLASH_COMMAND = {
  FLASH_GREEN,
  FLASH_RED,
  FLASH_WHITE,
};

/**
 * Status keys
 */
const ECHO_STATUS = 'echo_status';
const BEEPER_STATUS = 'beeper_status';
const LED_STATUS = 'led_status';
const CAR_SPEED = 'motor_speed';
const CAR_DIRECTION = 'direction';
const CAR_DEVIATION = 'deviation';
const CAMERA_STATUS = 'camera_status';

const STATUS_KEYS = {
  ECHO_STATUS,
  BEEPER_STATUS,
  LED_STATUS,
  CAR_DIRECTION,
  CAR_DEVIATION,
  CAR_SPEED,
  CAMERA_STATUS,
};

module.exports = {
  BEEPER_COMMAND,
  CAMERA_COMMAND,
  COMMANDS,
  COMMAND_TYPE,
  DRIVE_COMMAND,
  FLASH_COMMAND,
  STATUS_KEYS,
};
