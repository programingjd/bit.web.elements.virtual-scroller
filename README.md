[![Bit.dev package](https://img.shields.io/badge/%20bit%20-programingjd.web%2Felements%2Fvirtual-scroller-blueviolet)](https://bit.dev/programingjd/web/elements/virtual-scroller)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/programingjd/bit.web.elements.virtual-scroller)](https://bit.dev/programingjd/web/elements/virtual-scroller)
[![GitHub](https://img.shields.io/github/license/programingjd/bit.web.elements.virtual-scroller)](LICENSE)
![Travis (.org)](https://img.shields.io/travis/programingjd/bit.web.elements.virtual-scroller)
![Coveralls github](https://img.shields.io/coveralls/github/programingjd/bit.web.elements.virtual-scroller)


Javascript custom element.

Virtual scroller for displaying long lists or grids.

All the cells must be of the same height.


## Usage

```html
<html>
<head>
<style>
*{padding:0;margin:0;box-sizing:border-box}
html,body{width:100%;height:100%}
virtual-scroller{max-height:100%}
.row{height:2em}
</style>
</head>
<body>
<virtual-scroller>
<template><div class="row"></div></template>
</virtual-scroller>
<script>
(async()=>{
  await import('/virtual-scroller.mjs');
  const virtualScroller=document.querySelector('virtual-scroller');
  virtualScroller.model={
    count: 10000,
    cols: 3,
    render: (element, index, row, col)=>{
     element.textContent=`${index+1}`;
    }
  };
  document.body.classList.add('loaded');
})();
</script>
</body>
</html>
```

- Add a `<virtual-scroller>` element and make sure you set its height or max-height is set.
- Add a `<template>` inside the `<virtual-scroller>` and make sure its height is set.
- Load the module.
- Set the model.

## Model

The model can be either an array or an object.

If it's an array, then there's one row for each element and the template's `textContent` is set
to the array value.

If it's an object, then you should specify:

- count (as a value or a function)

  the number of elements
  
- cols (as a value of function) - optional

  the number of columns (defaults to 1).

- render (function)

  a function that updates the templates from the following arguments:

    - element

      the dom element for the template

    - index
    
      the index of the element to display
      
    - row
    
      the row index
      
    - col
    
      the column index
         



