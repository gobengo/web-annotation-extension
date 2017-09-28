import { createEventListener } from '../utils/event-listener'
import ext from '../utils/ext'
import storage from '../utils/storage'

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
          bodyText: null,
          // options managed by options page
          options: null,
          // status of saving
          save: {
            error: null,
            inProgress: false,
            // last response
            response: null,
            responseText: null
          }
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
            event.preventDefault()
            console.log('submit event!', event, this.state.options)
            this.setState({
              save: {
                inProgress: true
              }
            })
            const options = this.state.options
            const saveUrl = options && options.saveUrl
            if (!saveUrl) {
              console.error('No saveUrl to save with :(')
              this.setState({
                save: {
                  error: new Error('No Save URL Configured. Set one in extension options')
                }
              })
              return
            }
            const annotation = this._createWebAnnotation(this.state)
            // using xhr and not fetch because fetch response
            // will not let me read location header
            const xhr = new XMLHttpRequest()
            xhr.addEventListener('load', () => {
              this.setState({
                bodyText: null,
                save: {
                  error: null,
                  inProgress: false,
                  responseText: xhr.responseText,
                  response: {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    headers: new Map(Object.entries({
                      location: xhr.getResponseHeader('location')
                    }))
                  }
                }
              })
            })
            xhr.addEventListener('error', error => {
              console.error('Error saving annotation')
              this.setState({
                save: {
                  inProgress: false,
                  response: null,
                  responseText: null,
                  error: error
                }
              })
            })
            xhr.open('POST', saveUrl)
            xhr.setRequestHeader('Content-Type', 'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"')
            xhr.send(JSON.stringify(annotation, null, 2))
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
        storage.get([
          'showJsonToggle',
          'saveUrl'
        ], (options) => {
          this.setState({ options })
        })
      }
      render () {
        const { selection, save } = this.state
        const options = this.state.options || {}
        const selector = selection && selection.target && selection.target.selector
        const rangeDocumentFragmentSelector = selector && selector.find(s => s.type === 'https://bengo.is/ns/annotations/RangeDocumentFragmentSelector')
        const selectionHtml = rangeDocumentFragmentSelector && rangeDocumentFragmentSelector.contents
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
            ${save.inProgress
    ? `<input type="submit" value="Saving&hellip;" disabled></input>`
    : `<input type="submit" value="Save"></input>`
}
            ${this._renderSaveResponse(save)}
          </form>
          ${options.showJsonToggle
    ? `
              <div class="annotation-preview">
                <details>
                  <summary>JSON</summary>
                  <pre>${encodeHtmlEntities(JSON.stringify(webAnnotation, null, 2))}</pre>
                </details>
              </div>`
    : ''
}
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
      _renderSaveResponse (save = {}) {
        const response = save.response
        if (!response) {
          if (save.error) {
            return `${save.error}`
          }
          return ''
        }
        console.log('_renderSaveResponse', save)
        if (response.status >= 200 && response.status <= 299) {
          let location = response.headers.get('location')
          if (!location) {
            try { location = JSON.parse(save.responseText).url } catch (error) {}
          }
          if (location) return `Saved as <a href="${location}" target="_blank">${location}</a>`
          return 'Saved'
        }
        // Error :(
        let errorMessage
        switch (response.headers.get('content-type')) {
          case 'text/plain':
            errorMessage = save.responseText
            break
          case 'application/json':
            errorMessage = JSON.parse(save.responseText).message || save.responseText
            break
          default:
            errorMessage = `${response.statusText} (${response.status})`
        }
        return `Error: ${errorMessage}`
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
    // Apply for Mac OS only
    ext.runtime.getPlatformInfo(info => {
      if (info.os === 'mac') {
        setTimeout(() => {
          const width = document.body.clientWidth
          // Increasing body size enforces the popup redrawing
          document.body.style.width = `${width + 1}px`
          setTimeout(() => {
            document.body.style.width = ''
          }, 1)
        }, 250) // 250ms is enough to finish popup open animation
      }
    })
  }
  function encodeHtmlEntities (untrustedInput) {
    var encoded = untrustedInput.replace(/[\u00A0-\u9999<>&]/gim, function (i) {
      return '&#' + i.charCodeAt(0) + ';'
    })
    return encoded
  }
})
