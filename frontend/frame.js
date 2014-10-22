/**
 * Demo lib for include in frame
 */

/* jshint unused:false */

var callbackPool = [];
window[window.addEventListener ? 'addEventListener' : 'attachEvent']('message', receiveMessage);

function receiveMessage(event) {
    var params = event.data;
    switch (params.action) {
    case 'callback':
        if (params.callback && callbackPool.hasOwnProperty(params.callback)) {
            callbackPool[params.callback](params.data);
            delete callbackPool[params.callback];
        }
        break;
    }
}

function getCallbackId() {
    return Date.now();
}

function request(params, callback) {
    if (!params) {
        return false;
    }
    if (callback) {
        var callbackId = getCallbackId();
        callbackPool[callbackId] = callback;
        params['callback'] = callbackId;
    }
    parent.postMessage(params, '*');
}