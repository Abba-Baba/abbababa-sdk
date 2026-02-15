import type { AbbabaClient } from './client.js'
import type {
  ApiResponse,
  CreateServiceInput,
  UpdateServiceInput,
  Service,
  ServiceSearchParams,
  ServiceListResult,
} from './types.js'

export class ServicesClient {
  constructor(private client: AbbabaClient) {}

  async create(input: CreateServiceInput): Promise<ApiResponse<Service>> {
    return this.client.request<Service>('POST', '/api/v1/services', input)
  }

  async search(params?: ServiceSearchParams): Promise<ApiResponse<ServiceListResult>> {
    const query: Record<string, string> = {}

    if (params?.q) query.q = params.q
    if (params?.category) query.category = params.category
    if (params?.currency) query.currency = params.currency
    if (params?.maxPrice !== undefined) query.max_price = String(params.maxPrice)
    if (params?.minRating !== undefined) query.min_rating = String(params.minRating)
    if (params?.sortBy) query.sort_by = params.sortBy
    if (params?.limit !== undefined) query.limit = String(params.limit)
    if (params?.offset !== undefined) query.offset = String(params.offset)

    return this.client.request<ServiceListResult>('GET', '/api/v1/services', undefined, query)
  }

  async get(serviceId: string): Promise<ApiResponse<Service>> {
    return this.client.request<Service>('GET', `/api/v1/services/${serviceId}`)
  }

  async update(serviceId: string, input: UpdateServiceInput): Promise<ApiResponse<Service>> {
    return this.client.request<Service>('PATCH', `/api/v1/services/${serviceId}`, input)
  }

  async delete(serviceId: string): Promise<ApiResponse<{ message: string }>> {
    return this.client.request<{ message: string }>('DELETE', `/api/v1/services/${serviceId}`)
  }
}
