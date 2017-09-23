/* eslint-env webextensions */

import ext from './utils/ext'

console.log('loading background.js')

ext.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log('background.js ext.runtime.onMessage', request, sender)
  }
)

// Not fired when there is a popup.html
// chrome.browserAction.onClicked.addListener(function(tab) {
//   console.log('background.js - chrome.browserAction.onClicked', tab)
// chrome.runtime.sendMessage({
//   action: "browser-action-clicked"
// });
// });
