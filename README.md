# 16x2-lcd-menu
Library to abstract Adafruit 16x2 Character LCD menus, favors configuration over code for creating menus and screen navigation.


### Menu params
```javascript
{
  id: String, // -- identifier
  name: String, // -- Name of template
  enabled: Bool,
  actions: {
    up: func || string || null || undefined, // Action to perform on button up, function, or a string (string name of menu)
    down: func || string || null || undefined, // if null, go up or down a line if template.length > 2
    left: func || string || undefined, // undefined does nothing
    right: func || string || undefined,
    select: func || string || undefined
  },
  template: [String], // array of template string, line by line, since this is an x2 display we join 0 and 1 by \n
  data: func // function to retrieve data

}
```

## Usage

```javascript
const LCDMENU = require('16x2-lcd-menu');
const lcdMenu = new LCDMENU(60, true); // timeout backlight after 60 seconds, debug on

lcdMenu.addMenu({
  id: 'testMenu',
  name: 'Test Menu',
  enabled: true,
  actions: {
    right: 'testMenu2',
  },
  template: [
    'This is a',
    'Test Menu',
    'Welcome',
    'To the Demo',
  ],
});

lcdMenu.addMenu({
  id: 'testMenu2',
  name: 'Test Menu',
  enabled: true,
  template: [
    'Test Menu 2'
  ],
  actions: {
    left: 'testMenu',
  },
});

lcdMenu.init();
process.on('exit', lcdMenu.close); // Cleanup
```

## LCDMENU Methods

### lcd
Raw access to instantiated lcd plate library

### addMenu(Menu Object)
Adds a new menu
* if actions are not set, set it to an empty object (if it is truthy but not an object this could cause a crash)
* Defaults the id to match the name if an id is not set
* sets the first menu as the currentMenu (**WIP**)

### removeMenu(String id)
Removes menu specified by id
* Does nothing if id not provided or menu with that id doesn't exist.
* fails if there are no more menus registered

### enableMenu(String id)
Enables the specified menu

### disableMenu(String id)
Disables the specified menu

### setBacklight(Boolean state)
Turns the backlight on or off based on state (truthy)

### timeoutDisplay()
* Times out the display backlight after the configured # of seconds has passed
* does nothing if timeoutMs is set to 0

### displayTimeout set/get
* Set the display timeout in seconds.
* Doesn't auto-clear previous timer

### activeMenu set/get
* Set re-renders the display if valid, if not valid, does nothing.

### init()
Initializes the display
* If no menu is configured, add a default one
* Turn on backlight
* Clears the screen
* Runs render menu

### renderMenu(String id)
Renders provided or active menu, or 0 indexed menu if none provided

### clearDisplayTimeout()
Clears the timeout so the screen backlight stays on.

### close()
* Shuts down screen
* Clears screen, turns off backlight, stops polling button presses
