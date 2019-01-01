const adaLcd = require('../lib/16x2_adafruit_lcd.js');
const LCDMENU = new adaLcd.LCDMENU(60);

var num = 1;

const incrementNum = () => {
  num++;
  return Promise.resolve();
}

const decrementNum = () => {
  num--;
  // return Promise.resolve();
}

const getNum = () => ({num});

const menus = [
  {
    id: 'topLevel',
    name: 'topLevel',
    enabled: true,
    actions: {
      right: 'secondaryMenu',
      down: 'menuDown',
    },
    template: [
      'Welcome to',
      'LCDMENU',
    ]
  },
  {
    id: 'menuDown',
    name: 'menuDown',
    enabled: true,
    actions: {
      up: incrementNum,
      down: decrementNum,
      select: 'topLevel',
      left: 'topLevel',
    },
    data: getNum,
    template: ['Current Num: ${num}', '< Left to exit'],
  },
  {
    id: 'secondaryMenu',
    name: 'secondaryMenu',
    enabled: true,
    actions: {
      left: 'topLevel',
    },
    template: [
      'Line 1',
      'Line 2',
      'Line 3',
      'Line 4',
      'Line 5',
    ],
  },
];


menus.forEach((menu) => LCDMENU.addMenu(menu));

LCDMENU.init();

process.on('exit', () => {
  console.log('exit')
  adaLcd.lcd.clear();
	adaLcd.lcd.backlight(adaLcd.lcd.colors.OFF);
  adaLcd.lcd.close();
});
process.on('SIGINT', () => {
  console.log('ctrl c')
  adaLcd.lcd.clear();
  adaLcd.lcd.backlight(adaLcd.lcd.colors.OFF);
  adaLcd.lcd.close();
});
