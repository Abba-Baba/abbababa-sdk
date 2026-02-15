import * as http from 'node:http'
import type { WebhookEvent, WebhookHandler } from './types.js'

export class WebhookServer {
  private server: http.Server | null = null
  private handler: WebhookHandler
  private path: string

  constructor(handler: WebhookHandler, options?: { path?: string }) {
    this.handler = handler
    this.path = options?.path ?? '/webhook'
  }

  async start(port: number): Promise<{ url: string; port: number }> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        if (req.method !== 'POST' || req.url !== this.path) {
          res.writeHead(404)
          res.end('Not found')
          return
        }

        const chunks: Buffer[] = []
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
        }
        const body = Buffer.concat(chunks).toString('utf-8')

        let event: WebhookEvent
        try {
          event = JSON.parse(body) as WebhookEvent
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid JSON' }))
          return
        }

        try {
          await this.handler(event)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ received: true }))
        } catch (err) {
          console.error('[WebhookServer] Handler error:', err)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Handler failed' }))
        }
      })

      this.server.on('error', reject)
      this.server.listen(port, () => {
        resolve({ url: `http://localhost:${port}${this.path}`, port })
      })
    })
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve()
        return
      }
      this.server.close(() => {
        this.server = null
        resolve()
      })
    })
  }
}
