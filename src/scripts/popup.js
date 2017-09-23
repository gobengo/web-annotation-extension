/* eslint-env webextensions */

import ext from './utils/ext'
// import storage from './utils/storage'
// import { createEventListener } from './utils/event-listener'

// var popup = document.getElementById('annotation-popup')

let state = {}

function setState (stateUpdates) {
  state = Object.assign({}, state, stateUpdates)
  const { selection } = state
  renderSelection(selection)
}

ext.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.debug('popup onMessage', request.action, request, sender)
    switch (request.action) {
      case 'selection':
        setState({ selection: request.selection })
        break
      default:
        console.warn('popup received unexpected message', request.action, request)
    }
  }
)

// first load
window.onload = async () => {
  await requestSelection()
}

function renderSelection ({ text }) {
  const el = document.querySelector('.annotation-target')
  if (text) {
    el.innerHTML = `
      <blockquote>${text}</blockquote>
    `
    // this gets around a bug where the popup will render too short https://bugs.chromium.org/p/chromium/issues/detail?id=307912
    el.insertAdjacentHTML('beforeend', '<span></span>')
  } else {
    el.innerHTML = `<p>You have not selected anything to annotate</p>`
  }
}

async function requestSelection () {
  const tabs = await queryTabs({active: true, currentWindow: true})
  const activeTab = tabs[0]
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(activeTab.id, { action: 'request-selection' }, (response) => {
      resolve(response)
    })
  })
}

async function queryTabs (query) {
  return new Promise((resolve, reject) => {
    ext.tabs.query(query, function (tabs) {
      resolve(tabs)
    })
  })
}

// storage.get('color', function(resp) {
//   var color = resp.color;
//   if(color) {
//     popup.style.backgroundColor = color
//   }
// });

// var template = (data) => {
//   var json = JSON.stringify(data);
//   return (`
//   <div class="site-description">
//     <h3 class="title">${data.title}</h3>
//     <p class="description">${data.description}</p>
//     <a href="${data.url}" target="_blank" class="url">${data.url}</a>
//   </div>
//   <div class="action-container">
//     <button data-bookmark='${json}' id="save-btn" class="btn btn-primary">Save</button>
//   </div>
//   `);
// }
// var renderMessage = (message) => {
//   var displayContainer = document.getElementById("display-container");
//   displayContainer.innerHTML = `<p class='message'>${message}</p>`;
// }

// var renderBookmark = (data) => {
//   var displayContainer = document.getElementById("display-container")
//   if(data) {
//     var tmpl = template(data);
//     displayContainer.innerHTML = tmpl;
//   } else {
//     renderMessage("Sorry, could not extract this page's title and URL")
//   }
// }

// ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
//   var activeTab = tabs[0];
//   chrome.tabs.sendMessage(activeTab.id, { action: 'process-page' }, renderBookmark);
// });

// popup.addEventListener("click", function(e) {
//   if(e.target && e.target.matches("#save-btn")) {
//     e.preventDefault();
//     var data = e.target.getAttribute("data-bookmark");
//     ext.runtime.sendMessage({ action: "perform-save", data: data }, function(response) {
//       if(response && response.action === "saved") {
//         renderMessage("Your bookmark was saved successfully!");
//       } else {
//         renderMessage("Sorry, there was an error while saving your bookmark.");
//       }
//     })
//   }
// });

// var optionsLink = document.querySelector(".js-options");
// optionsLink.addEventListener("click", function(e) {
//   e.preventDefault();
//   ext.tabs.create({'url': ext.extension.getURL('options.html')});
// })
