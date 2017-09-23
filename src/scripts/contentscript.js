/* eslint-env webextensions */
import ext from './utils/ext'

// console.log('Annotate it! should add onMessage listener next')

console.log('adding onMessage listener')
ext.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('onMessage', request)
  switch (request.action) {
    case 'request-selection':
      const selection = window.getSelection()
      chrome.runtime.sendMessage({
        action: 'selection',
        selection: {
          text: selection.toString()
        }
      })
      break
    default:
      console.warn('contentscript.js got unknown message type', request.action, request)
  }
})

// document.addEventListener("selectionchange", function() {
//   const selection = window.getSelection()
// });
