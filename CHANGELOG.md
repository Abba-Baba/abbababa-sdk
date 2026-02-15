# @abbababa/sdk Changelog

## [0.4.0] - 2026-02-14

### 🚀 Major Changes - V2 Contracts

**BREAKING CHANGES**: SDK now uses V2 contracts deployed 2026-02-14 to Base Sepolia.

#### Contract Updates
- **AbbababaEscrowV2** (`0x1Aed68edafC24cc936cFabEcF88012CdF5DA0601`)
  - Simplified to 2% flat platform fee (removed complex fee structure)
  - Removed bond system entirely
  - Removed peer voting/arbitration panels
  - Single AI-only dispute resolution
  - New fields: `lockedAmount` and `platformFee` (replaces `amount` and `buyerFee`)

- **AbbababaScoreV2** (`0x15a43BdE0F17A2163c587905e8E439ae2F1a2536`)
  - Simplified scoring system
  - Removed GitHub verification (email + donation only)
  - New bond requirement system based on score

- **AbbababaResolverV2** (`0x41Be690C525457e93e13D876289C8De1Cc9d8B7A`)
  - Single `submitResolution` function (replaces tier-specific functions)
  - AI-only resolution (no human reviewers or peer arbitration)

#### API Changes

**Types (breaking)**:
- `EscrowDetails.amount` → `EscrowDetails.lockedAmount`
- `EscrowDetails.buyerFee` → `EscrowDetails.platformFee`
- `EscrowDetails.disputeTier` removed
- `FundResult.onChain.amount` → `FundResult.onChain.lockedAmount`
- `FundResult.onChain.buyerFee` → `FundResult.onChain.platformFee`

**ResolverClient (breaking)**:
- `submitAlgorithmicResolution()` removed
- `submitPeerArbitrationResult()` removed
- `submitHumanReview()` removed
- New: `submitResolution()` (single AI resolution function)

**Documentation**:
- All V1 references updated to V2
- Updated contract addresses in constants
- Updated comments to reflect simplified 2% fee model

### Migration Guide

```typescript
// Before (V1)
const details = await escrow.getEscrow(txId);
console.log(details.amount); // Amount in escrow
console.log(details.platformFee); // 2% platform fee (from V2)
console.log(details.disputeTier); // 0-3

// After (V2)
const details = await escrow.getEscrow(txId);
console.log(details.lockedAmount); // Amount locked (after fee)
console.log(details.platformFee); // 2% platform fee
// disputeTier removed - AI-only resolution

// Before (V1)
await resolver.submitAlgorithmicResolution(...);
// or
await resolver.submitPeerArbitrationResult(...);
// or
await resolver.submitHumanReview(...);

// After (V2)
await resolver.submitResolution(...); // Single function for AI resolution
```

---

## [0.3.0] - 2026-02-13
- Initial release with V1 contracts
- Multi-tier dispute resolution
- Bond system
- Complex fee structure

---

## [0.2.0] - 2026-02-12
- Beta release

---

## [0.1.0] - 2026-02-11
- Alpha release
