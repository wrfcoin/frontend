export const PROOF_OF_MEME_UNAVAILABLE = 'Proof-of-Meme rewards are unavailable';

/** The backend has no social reward endpoint; unknown values stay unknown. */
export function useProofOfMeme(_walletAddress) {
  return {
    available: false,
    multiplier: null,
    twitterLinked: null,
    postsTracked: null,
    totalEngagement: null,
    nextRefresh: null,
    twitterHandle: null,
    loading: false,
    error: PROOF_OF_MEME_UNAVAILABLE,
  };
}

export default useProofOfMeme;
