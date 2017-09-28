import { createEventListener } from '../utils/event-listener'
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
          // selection of webpage that the user is annotating
          selection: null,
          // the annotation body that the user has typed in
          bodyText: null
        }
      }
      constructor () {
        super()
        this._connected = false
        this._formListener = createEventListener({
          change: (event) => {
            console.log('change event', event)
            if (!event.target.name === 'annotation-body') return
            this.setState({
              bodyText: event.target.value
            })
          },
          submit: (event) => {
            console.log('submit event!', event)
            event.preventDefault()
          }
        })
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
        this._formListener.listenTo(this)
      }
      render () {
        const { selection } = this.state
        const selector = selection && selection.target && selection.target.selector
        const rangeDocumentFragmentSelector = selector && selector.find(s => s.type === 'https://bengo.is/ns/annotations/RangeDocumentFragmentSelector')
        const selectionHtml = rangeDocumentFragmentSelector && rangeDocumentFragmentSelector.contents
        console.log('rangeDocumentFragmentSelector', rangeDocumentFragmentSelector)
        const webAnnotation = this._createWebAnnotation(this.state)
        // @TODO (bengo) DEFINITELY need to sanitize this before any real users use it
        const annoTargetHtml = selectionHtml
          ? `<blockquote>${selectionHtml}</blockquote>`
          : (selection && selection.text)
            ? `<blockquote>${selection.text}</blockquote>`
            : `<p>You have not selected any text to annotate...</p>`
        const html = `
          <!--
            <h1>Annotate</h1>
            <label>Selection:</label>
          -->
          <div class="annotation-target">${annoTargetHtml}</div>
          <form class="annotation-form">
            <textarea name="annotation-body" class="annotation-body">${this.state.bodyText || ''}</textarea>
            <input type="submit" value="Save"></input>
          </form>
          <div class="annotation-preview">
            <details>
              <summary>JSON</summary>
              <pre>${encodeHtmlEntities(JSON.stringify(webAnnotation, null, 2))}</pre>
            </details>
          </div>
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
        this._formListener.stopListening(this)
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
      _createWebAnnotation (state) {
        console.debug('_createWebAnnotation', state)
        const target = state.selection && state.selection.target
        const annotation = {
          '@context': 'http://www.w3.org/ns/anno.jsonld',
          type: 'Annotation',
          target
        }
        if (state.bodyText) {
          annotation.body = {
            type: 'TextualBody',
            value: state.bodyText,
            format: 'text/plain'
          }
        }
        return annotation
      }
    })
  // https://bugs.chromium.org/p/chromium/issues/detail?id=428044
  function relayoutHack () {
    this.style.opacity = 0
    setTimeout(() => {
      this.style.opacity = 1
    }, 50)
  }
  function encodeHtmlEntities (untrustedInput) {
    var encoded = untrustedInput.replace(/[\u00A0-\u9999<>&]/gim, function (i) {
      return '&#' + i.charCodeAt(0) + ';'
    })
    return encoded
  }
})
