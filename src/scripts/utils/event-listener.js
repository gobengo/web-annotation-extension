/*
usage:
  const listener = createEventListener({
    error: function (event) => {
      console.log('error event!', event)
      console.log('will stop listening since error')
      this.stopListening(event.target)
    }
  })
  htmlElement.addEventListener('error', listener)
  // when you want to clean up right now
  listener.stopListening(htmlElement)
  // or to have listener remove itself itself up whenever it handles
  // any other event
  listener.stopListening()
*/
export const createEventListener = function createEventListener (eventTypeToHandler) {
  let stopped = false
  const api = {
    listenTo (element) {
      Object.keys(eventTypeToHandler).forEach(eventType => {
        element.addEventListener(eventType, this)
      })
    },
    handleEvent (event) {
      if (stopped) {
        event.currentTarget.removeEventListener(event.type, this)
        return
      }
      const handler = eventTypeToHandler[event.type]
      if (handler) {
        handler.call(this, event)
      }
    },
    // if `optionalElement` is passed, listeners will be removed now,
    // otherwise they will be removed on next handleEvent
    stopListening (optionalElement) {
      if (optionalElement) {
        Object.keys(eventTypeToHandler).forEach(eventType => {
          optionalElement.removeEventListener(eventType, this)
        })
      } else {
        stopped = true
      }
    }
  }
  return Object.assign(api, eventTypeToHandler)
}
