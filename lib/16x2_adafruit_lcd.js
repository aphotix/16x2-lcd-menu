const LCDPLATE = require('adafruit-i2c-lcd').plate;
const lcd = new LCDPLATE(1, 0x20, 50); // Poll intervalls < 50 can cause high cpu usage.


class LCDMENU {
  constructor(displayTimeout =0, debugMode, backlightColor = 'WHITE', rows =2, columns =16) {
    // register button down function
    this.menu = {};
    this.lcdOn = lcd.colors[backlightColor];
    this.lcdOff = lcd.colors.OFF;
    this.lcdState = false;
    this.lcd = lcd; // Expose raw lcd control

    this.rows = rows;
    this.columns = columns;

    this.currentLine = 0;

    this.displayTimeout = displayTimeout;

    this.menuTemplate = {
      id: undefined,
      name: undefined,
      enabled: true,
      actions: undefined,
      data: undefined,
      template: undefined,
    };

    this.buttonHandler = this.buttonHandler.bind(this);
    this.addMenu = this.addMenu.bind(this);
    this.enableMenu = this.enableMenu.bind(this);
    this.disableMenu = this.disableMenu.bind(this);
    this.setBacklight = this.setBacklight.bind(this);
    this.timeoutDisplay = this.timeoutDisplay.bind(this);
    this.init = this.init.bind(this);
    this.parseTemplateString = this.parseTemplateString.bind(this);
    this.renderMenu = this.renderMenu.bind(this);
    this.clearDisplayTimeout = this.clearDisplayTimeout.bind(this);
    this.close = this.close.bind(this);

    // Register LCD Button handler
    lcd.on('button_down', this.buttonHandler);
    this.debugMode = debugMode;
    this.debugMode && console.log('16x2 lcd menu Started');
  }


  buttonHandler(button) {
    const {
      clearDisplayTimeout,
      setBacklight,
      lcdState,
      activeMenu,
      menu,
      renderMenu,
      rows,
      timeoutDisplay,
    } = this;


    const buttonName = lcd.buttonName(button).toLowerCase();

    clearDisplayTimeout(); // prevent the screen from turning off
    // Turn the screen back on if the backlight is off
    if (!lcdState) {
      setBacklight(true);
    }

    if (
      activeMenu
      && menu[activeMenu]
    ) {

      if (!menu[activeMenu].actions) {
        console.error('No registered actions, ignored button press', activeMenu, buttonName);
        return timeoutDisplay();
      }

      const action = menu[activeMenu].actions[buttonName];

      switch (typeof action) {
        case 'function':
          // console.log('is a func');
          const result = action({buttonName, activeMenu})
          switch (typeof result) {
            case 'function':
            case 'object':
              if (typeof result.then === 'function') result.then(renderMenu);
              else renderMenu();
              break;
            case 'string':
              if (menu[result]) this.activeMenu = menu[result].id;
              else renderMenu();
              break;
            default:
              renderMenu();
          }
          break;
        case 'string':
          if (menu[action]) this.activeMenu = menu[action].id;
          break;
        default:
          const menuLen = menu[activeMenu].template.length;
          const scrollableLines = menuLen - rows + 1;
          if(scrollableLines > 0 && (buttonName === 'up' || buttonName === 'down')) {
            if (buttonName === 'up') {
              const curLine = this.currentLine;
              this.currentLine = curLine > 0 ? curLine - 1 : scrollableLines - 1;
              renderMenu(this.activeMenu);
            }
            if (buttonName === 'down' && this.currentLine < scrollableLines) {
              this.currentLine += 1;
              renderMenu(this.activeMenu);
            }
          } else {
            timeoutDisplay();
          }
      }
    } else {
      timeoutDisplay();
    }
    console.log('pressed', buttonName);
  }

  addMenu(rawMenu) {
    const { menu, menuTemplate } = this;

    const newMenu = {
      ...menuTemplate,
      ...rawMenu,
    };

    if (!newMenu.actions) newMenu.actions = {};
    if (!newMenu.id) newMenu.id = newMenu.name;
    if (!newMenu.template) newMenu.template = [];

    // Structure the template
    for(let i = 0; i < this.rows; i++) {
      if (!newMenu.template[i]) newMenu.template[i] = '';
      // newMenu.template[i].padEnd(this.columns, ' ');
    }

    // Set a default menu
    if (!Object.keys(menu).length) this.currentMenu = newMenu.id;

    menu[newMenu.id] = newMenu;
  }

  removeMenu(id) {
    if(!id || !this.menu[id]) return console.warn('Menu not found, not deleted');
    if(this.menu.length <= 1) return console.warn('Only one menu left, menu not deleted');
    delete this.menu[id];
    this.debugMode && console.log(`Removed Menu ${id}`);
    if(this.activeMenu === id) {
      this.currentMenu = '';
      this.clearDisplayTimeout();
      this.renderMenu();
    }
  }

  enableMenu(id) {
    if (!this.menu[id]) return this.debugMode && console.log(`menu not found ${id}`);
    this.menu[id].enabled = true;
  }

  disableMenu(id) {
    if (!this.menu[id]) return this.debugMode && console.log(`menu not found ${id}`);
    this.menu[id].enabled = false;
  }

  setBacklight(state) {
    this.lcdState = !!state;
    lcd.backlight(state ? this.lcdOn : this.lcdOff);
    this.debugMode && console.log(`Backlight ${state ? 'en':'dis'}abled`);
  }

  timeoutDisplay() {
    if (!this.timeoutMs) return;
    this.timeoutHandle = setTimeout(this.setBacklight, this.timeoutMs);
  }

  set displayTimeout(seconds) {
    this.timeoutMs = seconds * 1000;
  }

  get displayTimeout() {
    return Math.floor(this.timeoutMs / 1000);
  }

  set activeMenu(menu) {
    if (this.menu[menu]) {
      this.renderMenu(menu);
    } else {
      this.debugMode && console.log('Attempted to set invalid menu, doing nothing');
    }
  }

  get activeMenu() {
    return this.currentMenu;
  }

  init() {
    if (!this.menu.length) {
      // Add a default menu
      this.addMenu({
        name: 'default',
        template: ['16x2_adafruitLcd', 'By AphotiX', 'To Add a menu', 'See README.md']
      });
      this.debugMode && console.log('Initted without a menu, adding a default');
    }

    this.setBacklight(true);
    lcd.clear();
    this.renderMenu();
    this.debugMode && console.log('Init complete');
  }

  // WARNING if template data contains functions, they will be executed. Be conscious of the data you are injecting.
  // https://gist.github.com/malko/b8a432bbb2198ca5d38cd3dc27d40f24
  makeTemplate(templateString) {
    return (templateData) => new Function(`{${Object.keys(templateData).join(',')}}`, 'return `' + templateString + '`')(templateData);
  }

  parseTemplateString(template, data) { return this.makeTemplate(template)(data); }

  renderMenu(id) {
    const {
      menu,
      renderTemplate,
      rows,
      columns,
      parseTemplateString,
      timeoutDisplay,
    } = this;
    const menuKeys = Object.keys(menu)
    const menuLen = menuKeys.length;
    if (!menuLen) return timeoutDisplay();
    if (!id || !menu[id]) {
      // Get first menu
      id = this.activeMenu || Object.keys(menu)[0];
      this.debugMode && console.log('Invalid Id, using the menu at index 0');
      // return;
    }
    if (!menu[id].enabled) {
      this.debugMode && console.log('Attempted to select a disabled menu, do nothing');
      return timeoutDisplay();
    }

    const template = menu[id].template;

    if (!template || !template.length) {
      lcd.clear();
      this.debugMode && console.log('This menu has no template, clear the screen');
      return timeoutDisplay();
    }

    if (this.activeMenu !== id || (this.currentLine && this.currentLine + rows > menu[id].template.length)) {
      this.currentLine = 0;
    }

    // Generate template
    const data = menu[id].data ? menu[id].data() : {};
    const templateArray = [];
    for(let i = 0; i < rows; i++) {
      const newTemplate = parseTemplateString(template[i + this.currentLine] || '', data)
        .padEnd(columns, ' ')
        .slice(0, columns);
      templateArray.push(newTemplate);
    }

    // Push Template to display
    lcd.message(templateArray.join('\n'), true);
    this.debugMode && console.log('rendered template', templateArray.join('\n'));
    this.currentMenu = id;
    this.debugMode && console.log(`current menu ${id}`);
    timeoutDisplay();
  }

  clearDisplayTimeout() {
    clearTimeout(this.timeoutHandle);
  }

  close() {
    this.debugMode && console.log('Exiting...');
    lcd.clear();
    this.setBacklight();
    lcd.close();
  }
}


module.exports = LCDMENU;
