iframe-history
==============

Store history state in an iframe. Supports IE8+ and other major desktop browsers. Advisable not to use this solution for mobile platforms.

Usage
===

 - iframe element to be in the initial HTML (It can not be added progrmatically)
 - iframe element must point to an existing HTML page with the initial state. (e.g. home.html)
 - iframe-history.js must be loaded early during the page load, otherwise it can miss messages from the iframe


Sample iframe
===

```` html
<iframe style="position: absolute; top: -10px; left: -10px; width: 1px; height: 1px; visibility: hidden;" id="history" src="home.html"></iframe>
````


API
===

`iframehistory.onStateChange(callback)`

- `callback` - function(object)

`iframehistory.pushState(iframe, object, title, force)`

- `iframe` - iframe element to which the state is stored
- `object` - state object
- `title` - title associated with the specified object
- `force` - if true, pushing this state will also cause an onStateChange invocation