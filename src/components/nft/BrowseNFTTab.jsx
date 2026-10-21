/**
 * BrowseNFTTab Component
 *
 * Renders NFTs from nftAPI.getMarketplace() — no hardcoded entries.
 * Shows loading / error / empty states. Actions are non-destructive
 * (no alert() — NFT execute/bid/buy requires a backend transaction flow not yet wired).
 */

import React, { useState, useEffect } from 'react';
import { WrfCard, WrfButton, WrfBadge, WrfInput, WrfSelect } from '../DesignSystem';
import { nftAPI } from '../../services/api';

const NFTCard = ({ nft }) => {
  const attrs = nft.attributes ? Object.entries(nft.attributes).slice(0, 4) : [];

  return (
    <WrfCard headerTitle={nft.name} sx={{ height: '100%' }}>
      {nft.image && (
        <img
          src={nft.image}
          alt={nft.name}
          onError={(e) => { e.target.style.display = 'none'; }}
          style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
        />
      )}
      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.54)', margin: '8px 0' }}>
          By {nft.creator}
        </div>
        {nft.description && (
          <div style={{ fontSize: '0.875rem', margin: '8px 0' }}>{nft.description}</div>
        )}
        {nft.computationalType && (
          <div style={{ margin: '12px 0', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            <WrfBadge label={nft.computationalType} status="info" />
          </div>
        )}
        {attrs.length > 0 && (
          <div style={{ margin: '12px 0' }}>
            {attrs.map(([key, val]) => (
              <div key={key} style={{ fontSize: '0.875rem', margin: '4px 0' }}>
                <strong>{key}:</strong> {String(val)}
              </div>
            ))}
          </div>
        )}
      </div>
    </WrfCard>
  );
};

const BrowseNFTTab = () => {
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await nftAPI.getMarketplace();
      setNfts(data ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = nfts.filter(nft => {
    const q = searchTerm.toLowerCase();
    return (
      nft.name?.toLowerCase().includes(q) ||
      nft.description?.toLowerCase().includes(q) ||
      nft.computationalType?.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return (a.name ?? '').localeCompare(b.name ?? '');
    if (sortBy === 'complexity') return (b.complexity ?? 0) - (a.complexity ?? 0);
    return 0;
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: '1rem', margin: '0.5rem 0' }}>Loading marketplace…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#f44336' }}>
          Could not load marketplace
        </div>
        <div style={{ fontSize: '0.875rem', margin: '0.5rem 0' }}>{error.message}</div>
        <WrfButton variant="outline" onClick={load} sx={{ marginTop: '12px' }}>
          Retry
        </WrfButton>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '20px 0' }}>
        Browse Computational NFTs
      </div>

      <div style={{ display: 'flex', gap: '16px', margin: '20px 0', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '0.875rem', marginRight: '8px' }}>Sort by:</label>
          <WrfSelect
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            options={[
              { value: 'name', label: 'Name' },
              { value: 'complexity', label: 'Complexity (High → Low)' },
            ]}
            sx={{ minWidth: 120 }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <WrfInput
            placeholder="Search NFTs…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={{ width: '100%', textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
            {searchTerm ? 'No NFTs match your search' : 'No NFTs in the marketplace yet'}
          </div>
          <div style={{ fontSize: '0.875rem', margin: '0.5rem 0' }}>
            {searchTerm ? 'Try a different search term.' : 'Computational NFTs will appear here once published.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          {sorted.map(nft => (
            <div key={nft.id} style={{ flex: '1 1 calc(33.333% - 24px)', minWidth: '280px' }}>
              <NFTCard nft={nft} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseNFTTab;
