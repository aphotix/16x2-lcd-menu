# 16x2-lcd-menu
Library to quickly set up config menus on a 16x2 lcd


### Menu params
```
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
