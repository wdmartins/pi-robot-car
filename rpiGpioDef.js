// Raspberry PI definitions
// wiringPi  -   BCM_GPIO -  Name    -   Header  -   Name -  BCM_GPIO    -   WiringPi
//   -               -       3.3v        1 | 2       5v          -               - 
//   8           R1:0/R2:2   SDA0        3 | 4       5v          -               - 
//   9           R1:1/R2:3   SCL0        5 | 6       0v          -               -
//   7               4       GPIO7       7 | 8       TxD        14               15
//   -               -        0v         9 | 10      RxD        15               16
//   0              17       GPIO0      11 | 12     GPIO1       18                1
//   2          R1:21/R2:27  GPIO2      13 | 14      0v          -                -
//   3              22       GPIO3      15 | 16     GPIO4       23                4
//   -               -        3.3v      17 | 18     GPIO5       24                5
//  12              10        MOSI      19 | 20      0v          -                -
//  13               9        MISO      21 | 22     GPIO6       25                6
//  14              11        SCLK      23 | 24      CE0         8               10
//   -               -        0v        25 | 26      CE1         7               11
//  30               0       SDA.0      27 | 28     SCL.0        1               31
//  21               5      GPIO21      29 | 30      0v          -                -
//  22               6      GPIO22      31 | 32     GPIO26      12               26
//  23              13      GPIO23      33 | 34      0v          -                -
//  24              19      GPIO24      35 | 36     GPIO27      16               27
//  25              26      GPIO25      37 | 38     GPIO28      20               28
//   -               -       0v         39 | 40     GPIO29      21               29
// onOff uses the BCM GPIO port numbers, for instance, GPIO0 is actually 17.
// ws281x uses the BCM GPIO port numbers as well
// usonic uses wiringPi pin numbers so GPIO0 is 0
// rpi-gpio uses physical pin numbers so GPIO0 is 11;
const GPIO0_WPI = 0; const GPIO0_BCM = 17; const GPIO0_PHY = 11;
const GPIO1_WPI = 1; const GPIO1_BCM = 18; const GPIO1_PHY = 12;
const GPIO2_WPI = 2; const GPIO2_BCM = 27; const GPIO2_PHY = 13;
const GPIO3_WPI = 3; const GPIO3_BCM = 22; const GPIO3_PHY = 15;
const GPIO4_WPI = 4; const GPIO4_BCM = 23; const GPIO4_PHY = 16;
const GPIO5_WPI = 5; const GPIO5_BCM = 24; const GPIO5_PHY = 18;
const GPIO6_WPI = 6; const GPIO6_BCM = 25; const GPIO6_PHY = 22;
const GPIO7_WPI = 7; const GPIO7_BCM = 4; const GPIO7_PHY = 7;
const GPIO21_WPI = 21; const GPIO21_BCM = 5; const GPIO21_PHY = 29;
const GPIO22_WPI = 22; const GPIO22_BCM = 6; const GPIO22_PHY = 31;
const GPIO23_WPI = 23; const GPIO23_BCM = 13; const GPIO23_PHY = 33;
const GPIO24_WPI = 24; const GPIO24_BCM = 19; const GPIO24_PHY = 35;
const GPIO25_WPI = 25; const GPIO25_BCM = 26; const GPIO25_PHY = 37;
const GPIO26_WPI = 26; const GPIO26_BCM = 12; const GPIO26_PHY = 32;
const GPIO27_WPI = 27; const GPIO27_BCM = 16; const GPIO27_PHY = 36;
const GPIO28_WPI = 28; const GPIO28_BCM = 20; const GPIO28_PHY = 38;
const GPIO29_WPI = 29; const GPIO29_BCM = 21; const GPIO29_PHY = 40;

module.exports = {
    WPI: {
        GPIO0: GPIO0_WPI, 
        GPIO1: GPIO1_WPI, 
        GPIO2: GPIO2_WPI, 
        GPIO3: GPIO3_WPI, 
        GPIO4: GPIO4_WPI, 
        GPIO5: GPIO5_WPI, 
        GPIO6: GPIO6_WPI, 
        GPIO7: GPIO7_WPI, 
        GPIO21: GPIO21_WPI, 
        GPIO22: GPIO22_WPI, 
        GPIO23: GPIO23_WPI, 
        GPIO24: GPIO24_WPI, 
        GPIO25: GPIO25_WPI, 
        GPIO26: GPIO26_WPI, 
        GPIO27: GPIO27_WPI, 
        GPIO28: GPIO28_WPI, 
        GPIO29: GPIO29_WPI
    },
    BCM: {
        GPIO0: GPIO0_BCM, 
        GPIO1: GPIO1_BCM, 
        GPIO2: GPIO2_BCM, 
        GPIO3: GPIO3_BCM, 
        GPIO4: GPIO4_BCM, 
        GPIO5: GPIO5_BCM, 
        GPIO6: GPIO6_BCM, 
        GPIO7: GPIO7_BCM, 
        GPIO21: GPIO21_BCM, 
        GPIO22: GPIO22_BCM, 
        GPIO23: GPIO23_BCM, 
        GPIO24: GPIO24_BCM, 
        GPIO25: GPIO25_BCM, 
        GPIO26: GPIO26_BCM, 
        GPIO27: GPIO27_BCM, 
        GPIO28: GPIO28_BCM, 
        GPIO29: GPIO29_BCM
    },
    PHY: {
        GPIO0: GPIO0_PHY, 
        GPIO1: GPIO1_PHY, 
        GPIO2: GPIO2_PHY, 
        GPIO3: GPIO3_PHY, 
        GPIO4: GPIO4_PHY, 
        GPIO5: GPIO5_PHY, 
        GPIO6: GPIO6_PHY, 
        GPIO7: GPIO7_PHY, 
        GPIO21: GPIO21_PHY, 
        GPIO22: GPIO22_PHY, 
        GPIO23: GPIO23_PHY, 
        GPIO24: GPIO24_PHY, 
        GPIO25: GPIO25_PHY, 
        GPIO26: GPIO26_PHY, 
        GPIO27: GPIO27_PHY, 
        GPIO28: GPIO28_PHY, 
        GPIO29: GPIO29_PHY
    }
}