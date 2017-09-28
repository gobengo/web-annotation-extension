const bodyParser = require('body-parser')
const express = require('express')
const http = require('http')
const url = require('url')

const annotations = new Map()

function main () {
  const app = express()
    .use(bodyParser.json({type: (req) => true}))
    .post('/annotations/', (req, res, next) => {
      const id = String(Math.random()).slice(2)
      const annotationUrl = url.resolve(serverUrl(req), `/annotations/${id}`)
      const annotation = Object.assign({ id, url: annotationUrl, type: 'Annotation' }, req.body)
      annotations.set(id, annotation)
      res.status(201)
        .set('Location', annotationUrl)
        .send({
          id,
          type: 'Annotation',
          url: annotationUrl
        })
    })
    .get('/annotations/:id', (req, res, next) => {
      const annotation = annotations.get(req.params.id)
      if (!annotation) return res.status(404)
      res.status(200).send(annotation)
    })
  const server = http.createServer(app)
  const port = process.env.PORT || 0
  if (!port) console.warn('use PORT environment variable to choose an HTTP port')
  return new Promise((resolve, reject) => {
    server.listen(port, (err) => {
      if (err) reject(err)
      console.warn(`listening on port ${server.address().port}`)
    })
  })
}

if (require.main === module) {
  process.on('unhandledRejection', (err, p) => {
    console.error('unhandledRejection', p.ben, p, err)
    process.exit(1)
  })
  main()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('main() error. shutting down')
      console.trace(err)
      process.exit(1)
    })
}

function serverUrl (req) {
  const url = req.protocol + '://' + req.get('host') + req.originalUrl
  return url
}
