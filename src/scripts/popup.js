/* eslint-env webextensions */

import ext from './utils/ext'

// first load
window.onload = async () => {
  document.body.addEventListener('annotation-popup-rendered', () => {
    console.log('annotation-popup/rendered')
  })

  await requestSelection()
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
