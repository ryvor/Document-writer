const http = require('http')
const fs = require('fs')
const path = require('path')

const port = Number(process.env.PORT || 8787)
const fileArg = process.argv[2]

if (!fileArg) {
  console.error('Usage: node tools/esign-server.js <path-to-signable-html>')
  process.exit(1)
}

const filePath = path.resolve(process.cwd(), fileArg)

function serveFile(res) {
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
      res.end(`Failed to read: ${filePath}\n${String(err)}`)
      return
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(buf)
  })
}

http
  .createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') return serveFile(res)
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('Not found')
  })
  .listen(port, () => {
    console.log(`E-sign test server: http://localhost:${port}`)
    console.log(`Serving: ${filePath}`)
  })

