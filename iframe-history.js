/**
 * Browser Support
 * http://caniuse.com/x-doc-messaging
 * http://caniuse.com/datauri
 */
;
(function () {
    var RESERVED_IDENTIFIER = "IFRAME_HISTORY";
    var IGNORE_MILLISECONDS_OLD = 200;
    var mostRecentState = null;
    var onStateCallback = null;
    var iframe = null;

    function setFrame(element) {
        iframe = element;
    }

    /**
     * Assign a callback when the state has changed.
     *
     * If there have been multiple state changes before the callback was assigned, then it will only retrieve the most recent state.
     * @param callback
     */
    function onStateChange(callback) {
        onStateCallback = callback;
        if (mostRecentState) {
            var state = mostRecentState;
            mostRecentState = null;
            asyncCallback(state);
        }
    }

    /**
     * Ensure that the callback is always invoked in an asynchronous manner. Credit: http://spion.github.io/posts/why-i-am-switching-to-promises.html
     *
     * If a callback has not been defined, we will store this value and retrieve it later.
     */
    function asyncCallback(state) {
        if (onStateCallback) {
            setTimeout(function () {
                onStateCallback(state);
            }, 1);
        } else {
            mostRecentState = state;
        }
    }

    // Credit: https://github.com/ded/bowser/blob/master/src/bowser.js
    var isMSIE = /(msie|trident)/i.test(navigator.userAgent);

    // https://developer.mozilla.org/en-US/docs/Web/API/Window.location
    var origin = window.location.origin || (window.location.protocol + "//" + window.location.host);

    // ALWAYS initialize the handler. This needs to happen before the iframe will appear.
    if (window.addEventListener) {
        window.addEventListener('message', receiveMessage, false);
    } else {
        window.attachEvent('onmessage', receiveMessage);
    }


    /**
     * Handle the cross-document message.
     *
     * Note: "event.origin" won't be reliable, since we are sometimes using the data URI scheme.
     * @param event
     */
    function receiveMessage(event) {
        //console.log("received message " + event.data);
        var state = null;
        try {
            state = JSON.parse(event.data);
        } catch (e) {
            // Assume that the message was not for us and do nothing.
        }
        if (state && state.reserved === RESERVED_IDENTIFIER) {
            document.title = state.title;
            if (state.force || ((new Date()).valueOf() - state.timestamp > IGNORE_MILLISECONDS_OLD)) {
                asyncCallback(state.object);
            }
        }
    }

    /**
     * Source: http://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
     * @param unsafe
     */
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Note: value must be an escaped string. e.g. It must not contain any single quotation characters otherwise it will break the JS it will be injected into.
     * @param object
     * @param title
     * @param force
     */
    function pushState(object, title, force) {
        // TODO: Firefox doesn't seem to create history states if they are created too quickly. Ideally, we should detect and fail if this API is called too soon.

        // Note: IE only allows strings for postMessage, so make sure it is a string.
        var postIt = 'window.parent.postMessage(' + JSON.stringify(JSON.stringify({
            force: !!force,
            reserved: RESERVED_IDENTIFIER,
            timestamp: (new Date()).valueOf(), // milliseconds is granular given the time issue in Firefox described above.
            object: object,
            title: title
        })) + ', ' + JSON.stringify(origin) + ');';

        var html = "<!DOCTYPE html><head><title>" + escapeHtml(title) + "</title><script>" + postIt + "<\/script><\/head><html><body></body></html>";

        // The data uri scheme is not supported for iframes in Internet Explorer.
        if (isMSIE) {
            var doc = iframe.contentWindow.document;
            doc.open();
            doc.write(html);
            doc.close();
        } else {
            // Note: I had to change this to base64 encoding because of a funny problem with single quote in <title>.
            iframe.src = "data:text/html;charset=UTF-8;base64," + window.btoa(html);
        }
    }

    window.iframehistory = {
        onStateChange: onStateChange,
        pushState: pushState,
        setFrame: setFrame
    };
}());