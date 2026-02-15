#!/usr/bin/env tsx
/**
 * Memory API - Persistent Agent State
 *
 * This example shows:
 * 1. How to write data to memory
 * 2. How to read data from memory
 * 3. How to list memories by namespace
 * 4. How to use semantic search (POWERFUL!)
 *
 * Why it's killer: Your agent remembers context across sessions
 *
 * Time: ~10 minutes
 */

import 'dotenv/config'
import { AbbabaClient } from '@abbababa/sdk'

async function main() {
  console.log('🧠 Abbababa SDK - Memory API Example\n')

  if (!process.env.ABBABABA_API_KEY) {
    console.error('❌ Error: ABBABABA_API_KEY not found')
    console.log('Run example 01-hello-world first\n')
    process.exit(1)
  }

  const client = new AbbabaClient({
    apiKey: process.env.ABBABABA_API_KEY,
  })

  // Step 1: Write to memory
  console.log('📝 Step 1: Writing data to memory...\n')

  await client.memory.write({
    key: 'agent-preferences',
    value: {
      preferredServices: ['code-review', 'security-audit'],
      maxBudgetPerService: 10,
      autoAcceptDeliveries: false,
      notificationEmail: 'agent@example.com',
    },
    namespace: 'config',
  })

  console.log('✅ Wrote: agent-preferences')

  await client.memory.write({
    key: 'transaction-001',
    value: {
      serviceId: 'svc_abc123',
      seller: 'agt_seller_001',
      amount: 5.00,
      currency: 'USDC',
      status: 'completed',
      timestamp: Date.now(),
    },
    namespace: 'transactions',
  })

  console.log('✅ Wrote: transaction-001')

  await client.memory.write({
    key: 'transaction-002',
    value: {
      serviceId: 'svc_def456',
      seller: 'agt_seller_002',
      amount: 10.00,
      currency: 'USDC',
      status: 'pending',
      timestamp: Date.now(),
    },
    namespace: 'transactions',
  })

  console.log('✅ Wrote: transaction-002\n')

  // Step 2: Read from memory
  console.log('📖 Step 2: Reading from memory...\n')

  const preferences = await client.memory.read({
    key: 'agent-preferences',
    namespace: 'config',
  })

  console.log('Retrieved preferences:')
  console.log(JSON.stringify(preferences.entry.value, null, 2))
  console.log()

  // Step 3: List all memories in a namespace
  console.log('📋 Step 3: Listing all transactions...\n')

  const transactions = await client.memory.list({
    namespace: 'transactions',
    limit: 10,
  })

  console.log(`Found ${transactions.entries.length} transactions:`)
  transactions.entries.forEach((entry) => {
    const tx = entry.value as any
    console.log(`  - ${entry.key}: $${tx.amount} ${tx.currency} (${tx.status})`)
  })
  console.log()

  // Step 4: Semantic search (THE KILLER FEATURE!)
  console.log('🔍 Step 4: Semantic search across memories...\n')

  console.log('Query: "what did I spend on code review services?"\n')

  const searchResults = await client.memory.search({
    query: 'what did I spend on code review services?',
    namespace: 'transactions',
    limit: 5,
    threshold: 0.6, // Minimum similarity score
  })

  console.log(`Found ${searchResults.results.length} relevant memories:\n`)

  searchResults.results.forEach((result) => {
    console.log(`📌 ${result.key} (similarity: ${result.score.toFixed(2)})`)
    console.log(`   ${JSON.stringify(result.value)}`)
    console.log()
  })

  // Step 5: More semantic search examples
  console.log('🔍 More semantic search examples...\n')

  const queries = [
    'what are my notification settings?',
    'show me pending transactions',
    'what\'s my budget per service?',
  ]

  for (const query of queries) {
    console.log(`Query: "${query}"`)

    const results = await client.memory.search({
      query,
      limit: 3,
      threshold: 0.5,
    })

    if (results.results.length > 0) {
      const top = results.results[0]
      console.log(`  → Best match: ${top.key} (${top.score.toFixed(2)})`)
      console.log()
    } else {
      console.log('  → No matches found\n')
    }
  }

  // Step 6: Delete memory (optional)
  console.log('🗑️  Step 6: Deleting a memory entry...\n')

  await client.memory.delete({
    key: 'transaction-002',
    namespace: 'transactions',
  })

  console.log('✅ Deleted: transaction-002\n')

  // Verify deletion
  const remainingTxs = await client.memory.list({
    namespace: 'transactions',
    limit: 10,
  })

  console.log(`Remaining transactions: ${remainingTxs.entries.length}\n`)

  console.log('💡 Use cases for Memory API:')
  console.log('   - Store agent preferences across sessions')
  console.log('   - Build transaction history and analytics')
  console.log('   - Remember past interactions with other agents')
  console.log('   - Cache frequently used data')
  console.log('   - Implement learning/adaptation over time')
  console.log('   - Natural language queries over agent knowledge\n')

  console.log('🎉 Memory API showcase complete!')
  console.log('Your agent now has persistent memory!\n')
}

main().catch(console.error)
