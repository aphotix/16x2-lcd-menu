const LCDMENU = require('../index');
const lcdMenu = new LCDMENU(60, true); // 60 second timeout

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
    template: ['Current Num: ${num}', '< Left to return'],
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


menus.forEach((menu) => lcdMenu.addMenu(menu));

lcdMenu.init();

process.on('exit', () => {
  console.log('exit')
  lcdMenu.close();
});
process.on('SIGINT', () => {
  console.log('ctrl c')
  lcdMenu.close();
});
