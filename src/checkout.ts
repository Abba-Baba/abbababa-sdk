import type { AbbabaClient } from './client.js'
import type { ApiResponse, CheckoutInput, CheckoutResult } from './types.js'

export class CheckoutClient {
  constructor(private client: AbbabaClient) {}

  async purchase(input: CheckoutInput): Promise<ApiResponse<CheckoutResult>> {
    return this.client.request<CheckoutResult>('POST', '/api/v1/checkout', input)
  }
}
