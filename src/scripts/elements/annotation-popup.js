// import { createEventListener } from '../utils/event-listener'
import ext from '../utils/ext'

/* eslint-env browser */
(function (customElementsReady) {
  if ('customElements' in window) return customElementsReady()
  else if (window.WebComponents) window.addEventListener('WebComponentsReady', customElementsReady)
  else throw new Error('user-agent does not support Custom Elements')
})(function () {
  // Main Custom Element that renders the basic demo
  window.customElements.define('annotation-popup',
    class AnnotationPopupElement extends HTMLElement {
      get initialState () {
        return {
          selection: null
        }
      }
      constructor () {
        super()
        this._connected = false
        this.setState(this.initialState)
      }
      connectedCallback () {
        this._connected = true
        this.initialize()
        this._render()
      }
      initialize () {
        // @TODO removeListener on disconnected
        ext.runtime.onMessage.addListener((request, sender, sendResponse) => {
          console.log('popup onMessage', request)
          switch (request.action) {
            case 'selection':
              this.setState({ selection: request.selection })
              break
            default:
              console.warn('popup received unexpected message', request.action, request)
          }
        })
      }
      render () {
        const { selection } = this.state
        const selector = selection && selection.target && selection.target.selector
        const rangeDocumentFragmentSelector = selector && selector.find(s => s.type === 'https://bengo.is/ns/annotations/RangeDocumentFragmentSelector')
        const selectionHtml = rangeDocumentFragmentSelector && rangeDocumentFragmentSelector.contents
        console.log('rangeDocumentFragmentSelector', rangeDocumentFragmentSelector)
        const annoTargetHtml = selectionHtml
          ? `<blockquote>${selectionHtml}</blockquote>`
          : (selection && selection.text)
            ? `<blockquote>${selection.text}</blockquote>`
            : `<p>You have not selected any text to annotate...</p>`
        const html = `
          <h1>Annotate</h1>
          <label>Selection:</label>
          <div class="annotation-target">${annoTargetHtml}</div>
          <label>Annotation:</label>
          <form class="annotation-form">
            <textarea class="annotation-body"></textarea>
            <input type="submit" value="Save"></input>
          </form>
          <div class="annotation-preview"></div>
        `
        return html
      }
      setState (state) {
        console.debug('setState', state, { oldState: this.state })
        this.state = Object.assign({}, this.state, state)
        this._render()
      }
      attributeChangedCallback (attr, oldValue, newValue) {
        this._render()
      }
      disconnectedCallback () {
        this._connected = false
      }
      _render () {
        const html = this.render()
        if (html === this._html) {
          return
        }
        if (this._connected) {
          this._html = html
          this.innerHTML = html
          this.dispatchEvent(new Event('annotation-popup-rendered'))
          relayoutHack.call(this)
        }
      }
    })
  // https://bugs.chromium.org/p/chromium/issues/detail?id=428044
  function relayoutHack () {
    this.style.display = 'none'
    setTimeout(() => {
      this.style.display = 'block'
    }, 100)
  }
})
