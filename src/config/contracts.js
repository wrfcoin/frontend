/**
 * Smart contract addresses and ABIs.
 *
 * Addresses are read from VITE_* env vars at build time.
 * Never hardcode production addresses here — use environment-specific .env files.
 */

// Vite injects import.meta.env at build time; under Jest's ESM runtime it is
// undefined, so read it defensively (frontend#305 — the config is now unit-tested).
const ENV = (typeof import.meta !== 'undefined' && import.meta.env) || {};

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** True only when a real (non-zero) contract address was supplied at build time. */
export const isContractConfigured = (address) =>
  typeof address === 'string' && /^0x[0-9a-fA-F]{40}$/.test(address) && address.toLowerCase() !== ZERO_ADDRESS;

// ---------------------------------------------------------------------------
// WeatherStreakNFT — soulbound streak milestone badges (smart-contracts
// contracts/nft/WeatherStreakNFT.sol). frontend#305: the ABI below matches the
// contract as it exists on smart-contracts main. The contract has NO
// user-callable claim function — badges are minted and upgraded by the
// ORACLE_ROLE via recordSubmission() when a submission is recorded — and it is
// NOT ERC721Enumerable, so a wallet's badge is found through streakData(),
// which returns the wallet's single tokenId (0 when none).
// ---------------------------------------------------------------------------
export const WEATHER_STREAK_NFT_ADDRESS =
  ENV.VITE_WEATHER_STREAK_NFT_ADDRESS || ZERO_ADDRESS;

/** Minimal ABI: streakData, balanceOf, tokenURI (read-only; no claim exists). */
export const WEATHER_STREAK_NFT_ABI = [
  {
    name: 'streakData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'oracle', type: 'address' }],
    outputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'streakDays', type: 'uint256' },
      { name: 'lastSubmissionTimestamp', type: 'uint256' },
      { name: 'lastSubmissionDay', type: 'uint256' },
      { name: 'tier', type: 'uint8' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
];

export const WEATHER_STREAK_TIER_LABELS = ['Bronze', 'Silver', 'Gold', 'Diamond'];

// ---------------------------------------------------------------------------
// StormChaserNFT — awarded for extreme-weather data contributions
// ---------------------------------------------------------------------------
export const STORM_CHASER_NFT_ADDRESS =
  ENV.VITE_STORM_CHASER_NFT_ADDRESS || ZERO_ADDRESS;

/** Minimal ABI: tokenURI, balanceOf, tokenOfOwnerByIndex */
export const STORM_CHASER_NFT_ABI = [
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tokenOfOwnerByIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
];
