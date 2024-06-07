# static

Static Assets:

usage example:

* https://cdn.statically.io/gh/jcubic/static/master/js/lzjb.js
* https://cdn.jsdelivr.net/gh/jcubic/static@master/js/lzjb.js
* https://cdn.jsdelivr.net/gh/deniskipeles/static@master/js/pagepilot.js

 + in your svelte application inside App.svelte 
    ```svelte
    <script>
      ...
      import "https://cdn.jsdelivr.net/gh/deniskipeles/static@master/js/pagepilot.js";
      ...
    <script>
    ```
 + in your *.html file add the script
    ```html
    <html>
      <head>
        ...
      </head>
      <body>
        ...
      </body>
    </html>
    <script src="https://cdn.jsdelivr.net/gh/deniskipeles/static@master/js/pagepilot.js"></script>
    ```
