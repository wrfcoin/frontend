/**
 * frontend#305 — the WeatherStreakNFT ABI must match the contract that
 * exists on smart-contracts main (contracts/nft/WeatherStreakNFT.sol): no
 * claimMilestone (the contract has no user claim; badges are oracle-minted via
 * recordSubmission), no tokenOfOwnerByIndex (not ERC721Enumerable), and a
 * streakData() view that yields the wallet's single tokenId.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../features', () => ({ default: {}, FEATURES: {} }));

const contracts = await import('../contracts');

const CONTRACT_FUNCTIONS = new Set(['streakData', 'balanceOf', 'tokenURI', 'recordSubmission', 'grantOracleRole', 'revokeOracleRole', 'supportsInterface', 'streaks', 'streakOracle']);

describe('WEATHER_STREAK_NFT_ABI', () => {
  it('only names functions the deployed contract actually has', () => {
    const names = contracts.WEATHER_STREAK_NFT_ABI.map((f) => f.name);
    expect(names).not.toContain('claimMilestone');
    expect(names).not.toContain('tokenOfOwnerByIndex');
    for (const n of names) expect(CONTRACT_FUNCTIONS.has(n)).toBe(true);
    expect(names).toEqual(expect.arrayContaining(['streakData', 'balanceOf', 'tokenURI']));
  });

  it('exposes streakData with the contract return shape', () => {
    const fn = contracts.WEATHER_STREAK_NFT_ABI.find((f) => f.name === 'streakData');
    expect(fn.stateMutability).toBe('view');
    expect(fn.outputs.map((o) => o.name)).toEqual(['tokenId', 'streakDays', 'lastSubmissionTimestamp', 'lastSubmissionDay', 'tier', 'active']);
  });
});

describe('isContractConfigured', () => {
  it('is false for the zero address and non-addresses, true for a real address', () => {
    expect(contracts.isContractConfigured(contracts.ZERO_ADDRESS)).toBe(false);
    expect(contracts.isContractConfigured(undefined)).toBe(false);
    expect(contracts.isContractConfigured('0xnotanaddress')).toBe(false);
    expect(contracts.isContractConfigured('0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789')).toBe(true);
  });

  it('defaults the streak address to the zero address when no env var is set', () => {
    expect(contracts.isContractConfigured(contracts.WEATHER_STREAK_NFT_ADDRESS)).toBe(false);
  });
});
