const LCDPLATE = require('adafruit-i2c-lcd').plate;
const lcd = new LCDPLATE(1, 0x20, 50); // Poll intervalls < 50 can cause high cpu usage.


class LCDMENU {
  constructor(displayTimeout =0, rows =2, columns =16) {
    // register button down function
    this.menu = {};
    this.lcdOn = lcd.colors.WHITE;
    this.lcdOff = lcd.colors.OFF;
    this.lcdState = false;

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

    lcd.on('button_down', this.buttonHandler);
  }


  buttonHandler(button) {
    const {
      clearDisplayTimeout,
      setBacklight,
      lcdState,
      activeMenu,
      menu,
      renderMenu,
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
      && menu[activeMenu].actions
      && menu[activeMenu].actions[buttonName]
    ) {
      const action = menu[activeMenu].actions[buttonName];
      switch (typeof action) {
        case 'function':
          action({buttonName, activeMenu}).then(renderMenu);
          break;
        case 'string':
          if (menu[action]) this.activeMenu = menu[action].id;
          break;
        default:
          const scrollableLines = menu[activeMenu].template.length - this.rows;
          if (scrollableLines > 0 && this.currentLine < scrollableLines ) this.currentLine += 1;
      }
    }
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

  enableMenu(id) { this.menu[id].enabled = true; }

  disableMenu(id) { this.menu[id].enabled = false; }

  setBacklight(state) {
    this.lcdState = !!state;
    lcd.backlight(state ? this.lcdOn : this.lcdOff);
  }

  timeoutDisplay() {
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
    }
  }

  get activeMenu() {
    return this.currentMenu;
  }

  init() {
    this.setBacklight(true);
    lcd.clear();
    this.renderMenu();
  }

  // WARNING similar to using eval
  // https://gist.github.com/malko/b8a432bbb2198ca5d38cd3dc27d40f24
  makeTemplate(templateString) {
    return (templateData) => new Function(`{${Object.keys(templateData).join(',')}}`, 'return `' + templateString + '`')(templateData);
  }

  parseTemplateString(template, data) { return this.makeTemplate(template)(data); }

  renderMenu(id) {
    const { menu, renderTemplate, rows, columns, parseTemplateString } = this;
    const menuLen = Object.keys(menu).length;
    if (!id || !menuLen || !menu[id]) return;

    const template = menu[id].template;

    if (!template || !template.length) {
      lcd.clear();
      return;
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
    console.log('Message');
    console.log(templateArray)
    lcd.message(templateArray.join('\n'));

  }

  clearDisplayTimeout() {
    clearTimeout(this.timeoutHandle);
  }

  close() {
    this.setBacklight();
    lcd.close();
  }

}


module.exports = { LCDMENU, lcd };
