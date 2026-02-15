import { AbbabaClient } from './client.js'
import type {
  AbbabaConfig,
  CreateServiceInput,
  Service,
  Transaction,
  PollOptions,
  ApiResponse,
  SmartAccountConfig,
  UseSessionKeyConfig,
  AgentStats,
} from './types.js'

export class SellerAgent {
  public readonly client: AbbabaClient
  private running = false
  private walletAddress: string | null = null
  private kernelClient: unknown = null
  private resolvedGasStrategy: 'self-funded' | 'erc20' | null = null

  constructor(config: AbbabaConfig) {
    this.client = new AbbabaClient(config)
  }

  /** Register a service on the marketplace. */
  async listService(input: CreateServiceInput): Promise<Service> {
    const res = await this.client.services.create(input)
    if (!res.success || !res.data) {
      throw new Error(res.error ?? 'Failed to list service')
    }
    return res.data
  }

  /**
   * Poll for new purchases as an async generator.
   * Yields transactions in 'escrowed' or 'pending' status where this agent is the seller.
   * Tracks seen transaction IDs to avoid yielding duplicates.
   */
  async *pollForPurchases(options?: PollOptions): AsyncGenerator<Transaction> {
    const interval = options?.interval ?? 5_000
    const statuses = options?.statuses ?? ['escrowed', 'pending']
    const seen = new Set<string>()
    this.running = true

    while (this.running) {
      for (const status of statuses) {
        try {
          const res = await this.client.transactions.list({
            role: 'seller',
            status,
            limit: 50,
          })

          if (res.success && res.data) {
            for (const tx of res.data.transactions) {
              if (!seen.has(tx.id)) {
                seen.add(tx.id)
                yield tx
              }
            }
          }
        } catch (err) {
          console.error(`[SellerAgent] Poll error (status=${status}):`, err)
        }
      }

      await sleep(interval)
    }
  }

  /** Deliver results for a transaction via the API. */
  async deliver(transactionId: string, responsePayload: unknown): Promise<ApiResponse<Transaction>> {
    return this.client.transactions.deliver(transactionId, { responsePayload })
  }

  /**
   * Submit delivery proof on-chain (V4) and optionally deliver via the API.
   * Requires initWallet() or initWithSessionKey() to have been called first.
   * @param proofHash - keccak256 hash of the delivery proof data.
   * @param responsePayload - Optional API delivery payload. If provided, also calls the deliver endpoint.
   */
  async submitDelivery(
    transactionId: string,
    proofHash: `0x${string}`,
    responsePayload?: unknown
  ): Promise<string> {
    if (!this.kernelClient) {
      throw new Error('Wallet not initialized. Call initWallet() first.')
    }
    const { EscrowClient } = await import('./wallet/escrow.js')
    const escrow = new EscrowClient(this.kernelClient)
    const txHash = await escrow.submitDelivery(transactionId, proofHash)

    if (responsePayload !== undefined) {
      await this.client.transactions.deliver(transactionId, { responsePayload })
    }

    return txHash
  }

  /**
   * Initialize a ZeroDev smart account for on-chain operations.
   * Requires @zerodev/sdk, @zerodev/ecdsa-validator, and permissionless as peer deps.
   */
  async initWallet(config: SmartAccountConfig): Promise<string> {
    const { createSmartAccount } = await import('./wallet/smart-account.js')
    const result = await createSmartAccount(config)
    this.walletAddress = result.address
    this.kernelClient = result.kernelClient
    this.resolvedGasStrategy = result.gasStrategy
    return result.address
  }

  /**
   * Initialize wallet from a serialized session key (agent operation).
   * No owner private key needed — only the serialized session key string.
   */
  async initWithSessionKey(config: UseSessionKeyConfig): Promise<string> {
    const { useSessionKey } = await import('./wallet/session-keys.js')
    const result = await useSessionKey(config)
    this.walletAddress = result.address
    this.kernelClient = result.kernelClient
    this.resolvedGasStrategy = result.gasStrategy
    return result.address
  }

  /**
   * Get own on-chain reputation score.
   * Does not require a wallet — read-only.
   */
  async getAgentScore(agentAddress?: string): Promise<AgentStats> {
    const address = agentAddress ?? this.walletAddress
    if (!address) {
      throw new Error('No address. Provide agentAddress or call initWallet() first.')
    }
    const { ScoreClient } = await import('./wallet/escrow.js')
    const score = new ScoreClient()
    return score.getAgentStats(address)
  }

  /** Stop the polling loop. */
  stop(): void {
    this.running = false
  }

  getWalletAddress(): string | null {
    return this.walletAddress
  }

  /** Returns the resolved gas strategy after initWallet() or initWithSessionKey(). */
  getGasStrategy(): 'self-funded' | 'erc20' | null {
    return this.resolvedGasStrategy
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
