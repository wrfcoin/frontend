import { describe, it, expect } from '@jest/globals';
import { cantVoteText, describeAdvisoryError, notEligibleText } from '../AdvisoryActions';

const SNAPSHOT = 'this wallet held under 1 WRF spendable when the proposal was created';
const base = { voted: null, votingOpen: true, eligible: true, reason: null } as const;

describe('cantVoteText', () => {
  it('not eligible: says why, names the creation block, and what happens next', () => {
    expect(cantVoteText({ ...base, eligible: false, reason: SNAPSHOT }, 27028)).toBe(
      'This wallet can\'t vote on this proposal: it held less than 1 WRF when the proposal was created (block 27028). '
      + 'It can vote on proposals created from now on, while it holds 1 WRF or more.',
    );
  });
  it('invents no block number when the proposal has none', () => {
    const t = cantVoteText({ ...base, eligible: false, reason: SNAPSHOT }, null);
    expect(t).toBe(notEligibleText());
    expect(t).not.toMatch(/block/);
  });
  it('already voted and closed keep their own words', () => {
    expect(cantVoteText({ ...base, voted: 'for', reason: 'this wallet already voted' }, 5)).toBe('This wallet already voted for.');
    expect(cantVoteText({ ...base, votingOpen: false, reason: 'voting has closed' }, 5)).toBe('Voting on this proposal has closed.');
  });
  it('an unknown reason is passed on honestly; none at all stays generic', () => {
    expect(cantVoteText({ ...base, reason: 'something new' }, 5)).toBe('This wallet can\'t vote: something new.');
    expect(cantVoteText(base, 5)).toBe('This wallet can\'t vote on this one.');
  });
  it('the node refusing a vote for the snapshot rule gets the same plain words', () => {
    const err = Object.assign(new Error('governance: SP_ADVISORY_GOVERNANCE_REFUSED: wallet held under 1 WRF spendable when the proposal was created'), { details: { code: 'ADVISORY_GOVERNANCE_REFUSED' } });
    expect(describeAdvisoryError(err)).toBe(notEligibleText());
  });
});
