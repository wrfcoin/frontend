/**
 * NFTGallerySection Component
 *
 * Displays NFT achievements earned by the connected wallet.
 * Data comes from nftAPI.getUserNFTs — no hardcoded NFTs.
 * Renders disconnected / loading / error / empty states explicitly.
 */

import React, { useState, useEffect } from 'react';
import {
  Image,
  Award,
  Star,
  Filter,
  Grid,
  List,
  ExternalLink,
  Share2,
  AlertCircle,
  RefreshCw,
  WalletMinimal,
} from 'lucide-react';
import { useWalletConnection } from '../../../hooks/useWalletConnection';
import { nftAPI } from '../../../services/api';
import './NFTGallerySection.css';

const rarityConfig = {
  legendary: { label: 'Legendary', color: '#FFD700', bg: 'rgba(255, 215, 0, 0.15)' },
  epic: { label: 'Epic', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)' },
  rare: { label: 'Rare', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  uncommon: { label: 'Uncommon', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)' },
  common: { label: 'Common', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)' },
};

const complexityToRarity = (complexity) => {
  if (complexity >= 9) return 'legendary';
  if (complexity >= 7) return 'epic';
  if (complexity >= 5) return 'rare';
  if (complexity >= 3) return 'uncommon';
  return 'common';
};

const NFTCard = ({ nft, viewMode }) => {
  const rarity = rarityConfig[nft.rarity] ?? rarityConfig.common;
  const attrEntries = nft.attributes ? Object.entries(nft.attributes).slice(0, 4) : [];

  if (viewMode === 'list') {
    return (
      <div className="nft-list-item">
        <div className="nft-list-image" style={{ background: rarity.bg }}>
          {nft.image
            ? <img src={nft.image} alt={nft.name} style={{ width: 32, height: 32, objectFit: 'cover' }} />
            : <Award size={24} style={{ color: rarity.color }} />}
        </div>
        <div className="nft-list-info">
          <span className="nft-name">{nft.name}</span>
          <span className="nft-collection">{nft.computationalType ?? 'Achievement'}</span>
        </div>
        <span className="nft-rarity-badge" style={{ color: rarity.color, background: rarity.bg }}>
          {rarity.label}
        </span>
        <div className="nft-list-actions">
          <button className="nft-action-btn"><Share2 size={16} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="nft-card">
      <div className="nft-image" style={{ background: rarity.bg }}>
        {nft.image
          ? <img src={nft.image} alt={nft.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Award size={48} style={{ color: rarity.color }} />}
        <span className="nft-rarity" style={{ color: rarity.color, background: rarity.bg }}>
          {rarity.label}
        </span>
      </div>
      <div className="nft-content">
        <h4 className="nft-title">{nft.name}</h4>
        <span className="nft-collection-name">{nft.computationalType ?? 'Achievement'}</span>
        {nft.description && <p className="nft-description">{nft.description}</p>}
        {attrEntries.length > 0 && (
          <div className="nft-attributes">
            {attrEntries.map(([trait, value]) => (
              <div key={trait} className="nft-attribute">
                <span className="attr-label">{trait}</span>
                <span className="attr-value">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="nft-footer">
          <span className="nft-earned">By {nft.creator}</span>
          <div className="nft-actions">
            <button className="nft-action-btn"><Share2 size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NFTGallerySection = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [filterRarity, setFilterRarity] = useState('all');
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { account } = useWalletConnection();

  useEffect(() => {
    if (!account) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const raw = await nftAPI.getUserNFTs(account);
        if (!cancelled) {
          const enriched = (raw ?? []).map(n => ({
            ...n,
            rarity: complexityToRarity(n.complexity ?? 0),
          }));
          setNfts(enriched);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [account]);

  const filteredNFTs = filterRarity === 'all'
    ? nfts
    : nfts.filter(n => n.rarity === filterRarity);

  const stats = {
    total: nfts.length,
    legendary: nfts.filter(n => n.rarity === 'legendary').length,
    epic: nfts.filter(n => n.rarity === 'epic').length,
    rare: nfts.filter(n => n.rarity === 'rare').length,
  };

  if (!account) {
    return (
      <div className="nft-gallery-section">
        <div className="nft-empty">
          <WalletMinimal size={48} />
          <h3>Wallet not connected</h3>
          <p>Connect your wallet to see your NFT achievements.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="nft-gallery-section">
        <div className="nft-empty">
          <RefreshCw size={32} className="spinning" />
          <p>Loading your NFTs…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nft-gallery-section">
        <div className="nft-empty">
          <AlertCircle size={32} />
          <h3>Could not load NFTs</h3>
          <p>{error.message}</p>
          <button
            className="nft-retry-btn"
            onClick={() => {
              if (account) {
                setError(null);
                setIsLoading(true);
                nftAPI.getUserNFTs(account)
                  .then(raw => {
                    const enriched = (raw ?? []).map(n => ({
                      ...n,
                      rarity: complexityToRarity(n.complexity ?? 0),
                    }));
                    setNfts(enriched);
                  })
                  .catch(setError)
                  .finally(() => setIsLoading(false));
              }
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="nft-gallery-section">
      {/* Stats */}
      <div className="nft-stats">
        <div className="nft-stat">
          <Image size={20} />
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total NFTs</span>
        </div>
        <div className="nft-stat legendary">
          <Star size={20} />
          <span className="stat-value">{stats.legendary}</span>
          <span className="stat-label">Legendary</span>
        </div>
        <div className="nft-stat epic">
          <Award size={20} />
          <span className="stat-value">{stats.epic}</span>
          <span className="stat-label">Epic</span>
        </div>
        <div className="nft-stat rare">
          <Award size={20} />
          <span className="stat-value">{stats.rare}</span>
          <span className="stat-label">Rare</span>
        </div>
      </div>

      {/* Controls */}
      <div className="nft-controls">
        <select
          value={filterRarity}
          onChange={(e) => setFilterRarity(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Rarities</option>
          <option value="legendary">Legendary</option>
          <option value="epic">Epic</option>
          <option value="rare">Rare</option>
          <option value="uncommon">Uncommon</option>
          <option value="common">Common</option>
        </select>
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid size={18} />
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Gallery */}
      {filteredNFTs.length > 0 ? (
        <div className={`nft-gallery ${viewMode}`}>
          {filteredNFTs.map(nft => (
            <NFTCard key={nft.id} nft={nft} viewMode={viewMode} />
          ))}
        </div>
      ) : (
        <div className="nft-empty">
          <Image size={48} />
          <h3>{filterRarity === 'all' ? 'No NFTs yet' : 'No NFTs found'}</h3>
          <p>
            {filterRarity === 'all'
              ? 'Complete weather contributions and achievements to earn NFT badges.'
              : 'Try a different rarity filter.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default NFTGallerySection;
