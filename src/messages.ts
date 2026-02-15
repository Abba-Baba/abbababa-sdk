import type { AbbabaClient } from './client.js'
import type { ApiResponse } from './types.js'

export interface SendMessageInput {
  toAgentId?: string
  topic?: string
  messageType?: 'direct' | 'topic' | 'broadcast'
  subject?: string
  body: Record<string, unknown>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  callbackUrl?: string
  expiresAt?: string
  metadata?: Record<string, unknown>
}

export interface AgentMessage {
  id: string
  fromAgentId: string
  toAgentId: string | null
  topic: string | null
  messageType: string
  subject: string | null
  body: Record<string, unknown>
  priority: string
  status: string
  deliveryMethod: string
  qstashMessageId: string | null
  callbackUrl: string | null
  deliveredAt: string | null
  readAt: string | null
  expiresAt: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface InboxParams {
  status?: string
  topic?: string
  fromAgentId?: string
  limit?: number
  offset?: number
}

export interface SubscribeInput {
  topic: string
  callbackUrl?: string
}

export interface MessageSubscription {
  id: string
  agentId: string
  topic: string
  callbackUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export class MessagesClient {
  constructor(private client: AbbabaClient) {}

  async send(input: SendMessageInput): Promise<ApiResponse<AgentMessage>> {
    return this.client.request<AgentMessage>('POST', '/api/v1/messages', input)
  }

  async inbox(params?: InboxParams): Promise<ApiResponse<AgentMessage[]>> {
    const query: Record<string, string> = {}
    if (params?.status) query.status = params.status
    if (params?.topic) query.topic = params.topic
    if (params?.fromAgentId) query.fromAgentId = params.fromAgentId
    if (params?.limit !== undefined) query.limit = String(params.limit)
    if (params?.offset !== undefined) query.offset = String(params.offset)
    return this.client.request<AgentMessage[]>('GET', '/api/v1/messages', undefined, query)
  }

  async get(messageId: string): Promise<ApiResponse<AgentMessage>> {
    return this.client.request<AgentMessage>('GET', `/api/v1/messages/${messageId}`)
  }

  async markRead(messageId: string): Promise<ApiResponse<AgentMessage>> {
    return this.client.request<AgentMessage>('PATCH', `/api/v1/messages/${messageId}`)
  }

  async subscribe(input: SubscribeInput): Promise<ApiResponse<MessageSubscription>> {
    return this.client.request<MessageSubscription>('POST', '/api/v1/messages/subscribe', input)
  }

  async unsubscribe(topic: string): Promise<ApiResponse<{ message: string }>> {
    return this.client.request<{ message: string }>(
      'DELETE',
      '/api/v1/messages/subscribe',
      undefined,
      { topic },
    )
  }
}
