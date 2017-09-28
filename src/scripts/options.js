/* eslint-env webextensions */

// import ext from './utils/ext'
import storage from './utils/storage'

const form = document.querySelector('form')

// save on change
form.addEventListener('change', (event) => {
  console.log('change event', event)
  let valueToStore
  switch (event.target.type) {
    case 'checkbox':
      valueToStore = event.target.checked
      break
    default:
      console.warn('Unexpected input type', event.target.type)
      valueToStore = event.target.value
  }
  const values = { [event.target.name]: valueToStore }
  console.log('setting', values)
  storage.set(values)
});

// restore from storage
[].forEach.call(form.elements, (input) => {
  const name = input.name
  storage.get(name, (stored) => {
    const storedValue = stored[name]
    console.log('got', name, storedValue)
    switch (input.type) {
      case 'checkbox':
        input.checked = Boolean(storedValue)
        break
      default:
        console.warn('Unexpected input type', input.type)
        input.value = storedValue
    }
  })
})
