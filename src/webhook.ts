import * as http from 'node:http'
import * as crypto from 'node:crypto'
import type { WebhookEvent, WebhookHandler } from './types.js'

/**
 * Verify an abbababa webhook signature.
 *
 * Abbababa signs outbound webhooks with HMAC-SHA256.
 * Signature header format: "t=<unix_seconds>,v1=<hmac_hex>"
 * Signed payload: "<timestamp>.<json_body>"
 *
 * @param body           Raw request body string
 * @param signatureHeader  Value of the X-Abbababa-Signature header
 * @param secret         Your WEBHOOK_SIGNING_SECRET (from abbababa dashboard)
 * @param toleranceSeconds  Max age of the timestamp (default 300s / 5 min)
 * @returns true if signature is valid, false otherwise
 */
export function verifyWebhookSignature(
  body: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300
): boolean {
  try {
    const parts = signatureHeader.split(',')
    const tPart = parts.find((p) => p.startsWith('t='))
    const v1Part = parts.find((p) => p.startsWith('v1='))
    if (!tPart || !v1Part) return false

    const timestamp = parseInt(tPart.slice(2), 10)
    if (!Number.isFinite(timestamp)) return false

    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - timestamp) > toleranceSeconds) return false

    const providedSig = v1Part.slice(3)
    const toSign = `${timestamp}.${body}`
    const expected = crypto.createHmac('sha256', secret).update(toSign).digest('hex')

    // Constant-length buffers required for timingSafeEqual
    if (providedSig.length !== expected.length) return false
    return crypto.timingSafeEqual(Buffer.from(providedSig), Buffer.from(expected))
  } catch {
    return false
  }
}

export class WebhookServer {
  private server: http.Server | null = null
  private handler: WebhookHandler
  private path: string
  private signingSecret: string | undefined

  /**
   * @param handler       Async function called with each verified webhook event
   * @param options.path          URL path to listen on (default: '/webhook')
   * @param options.signingSecret  WEBHOOK_SIGNING_SECRET from abbababa.
   *                               When provided, requests with an invalid or missing
   *                               X-Abbababa-Signature header are rejected with 401.
   *                               When omitted, signatures are not verified (not recommended).
   */
  constructor(handler: WebhookHandler, options?: { path?: string; signingSecret?: string }) {
    this.handler = handler
    this.path = options?.path ?? '/webhook'
    this.signingSecret = options?.signingSecret
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

        // Verify signature if a signing secret is configured
        if (this.signingSecret) {
          const sigHeader = (req.headers['x-abbababa-signature'] as string | undefined) ?? ''
          if (!sigHeader || !verifyWebhookSignature(body, sigHeader, this.signingSecret)) {
            res.writeHead(401, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Invalid or missing webhook signature' }))
            return
          }
        }

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
