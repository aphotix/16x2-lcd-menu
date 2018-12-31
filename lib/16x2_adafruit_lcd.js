const LCDPLATE = require('adafruit-i2c-lcd').plate;
const lcd = new LCDPLATE(1, 0x20, 50); // Poll intervalls < 50 can cause high cpu usage.


class LCDMENU {
  constructor() {
    // register button down function
    lcd.on('button_down', this.buttonHandler);
    this.menu = [];
    this.templates = {};
    this.lcdOn = lcd.colors.WHITE;
    this.lcdOff = lcd.colors.OFF;
    this.lcdState = false;
  }

  backlightOn(color) {

  }

  buttonHandler = (button) => {
    this.clearDisplayTimeout() // prevent the screen from turning off
    // Turn the screen back on if the backlight is off
    if (!this.lcdState) {
      this.setBacklight(true);
    }

    console.log(button);
  }

  addTemplate = (template) => {
    this.templates[template.id] = template;
  }

  addMenu = (menu) => {
    this.menu.push(menu);
  }

  setBacklight = (state) => {
    this.lcdState = !!state;
    lcd.backlight(state ? this.lcdOn : this.lcdOff);
  }

  timeoutDisplay = () => {
    this.timeoutHandle = setTimeout(this.setBacklight, this.timeoutMs);
  }

  set displayTimeout = (seconds) => {
    this.timeoutMs = seconds * 1000;
  }

  get displayTimeout = () => {
    return Math.floor(this.timeoutMs / 1000);
  }

  clearDisplayTimeout = () => {
    clearTimeout(this.timeoutHandle);
  }

  close = () => {
    this.setBacklight();
    lcd.close();
  }

}
