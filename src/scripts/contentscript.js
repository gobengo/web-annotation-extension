/* eslint-env webextensions, browser */
import ext from './utils/ext'
import * as TextQuote from 'dom-anchor-text-quote'
import * as TextPosition from 'dom-anchor-text-position'
import * as xpath from 'simple-xpath-position'
import FragmentSelector from 'dom-anchor-fragment'

// console.log('Annotate it! should add onMessage listener next')

/**
 * Create various Selector types from a DOM Range object
 * https://www.w3.org/TR/annotation-model/#selectors
 */
const selectorFromRange = {
  TextQuoteSelector: (range, root = document.body) => Object.assign({
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    type: 'TextQuoteSelector'
  }, TextQuote.fromRange(root, range)),

  TextPositionSelector: (range, root = document.body) => Object.assign({
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    type: 'TextPositionSelector'
  }, TextPosition.fromRange(document.body, range)),

  XPathRangeSelector: (range) => ({
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    type: 'RangeSelector',
    startSelector: {
      type: 'XPathSelector',
      value: xpath.fromNode(range.startContainer)
    },
    endSelector: {
      type: 'XPathSelector',
      value: xpath.fromNode(range.endContainer)
    }
  }),

  FragmentSelector: (range, root = document.body) => FragmentSelector.fromRange(root, range).toSelector(),

  /**
   * This idea could be improved:
   * * When selecting innerText of a <pre>, it would be ideal for 'contents' to still be wrapped in a <pre>
   * Probably it's best not to have this 'presentation' optimization in the selector itself.
   * But perhaps selectors could have a property to a 'presentable' version
   */
  RangeDocumentFragmentSelector: (range) => {
    let html = serializeDocumentFragment(range.cloneContents())
    if (range.startContainer === range.endContainer && range.endContainer instanceof Text && range.endContainer.parentNode.tagName === 'PRE') {
      html = `<pre>${html}</pre>`
    }
    return {
      type: 'https://bengo.is/ns/annotations/RangeDocumentFragmentSelector',
      contents: html
    }
  }
}

ext.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('contentscript onMessage', request)
  switch (request.action) {
    case 'request-selection':
      const selection = window.getSelection()
      if (selection.rangeCount) {
        const range = selection.getRangeAt(0)
        chrome.runtime.sendMessage({
          action: 'selection',
          selection: {
            text: selection.toString(),
            target: {
              source: String(document.location),
              selector: Array.from(Object.entries(selectorFromRange))
                .map(([key, createSelector]) => {
                  try {
                    return createSelector(range)
                  } catch (error) {
                    console.debug('error creating selector', error)
                    return null
                  }
                })
                .filter(Boolean)
            }
          }
        })
      }
      break
    default:
      console.warn('contentscript.js got unknown message type', request.action, request)
  }
})

function serializeDocumentFragment (frag) {
  const container = document.createElement('div')
  container.appendChild(frag)
  return container.innerHTML
}
