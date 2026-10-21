import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Alert,
  AlertTitle,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import { WrfCard, WrfSelect } from '../DesignSystem';
import { nftAPI } from '../../services/api.ts';
import { walletProviderManager } from '../../services/walletProviders/WalletProviderManager.js';

const CreateNft = () => {
  const [nftData, setNftData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    nftType: 'Art',
    royaltyPercentage: 2.5,
    attributes: [],
    computationalSpecs: {
      computePower: 0,
      memory: 0,
      storage: 0,
      duration: 30,
      renewable: false,
      // Weather model specific fields
      modelType: '',
      region: '',
      resolution: '',
      forecastLength: 7,
      updateFrequency: '',
      // Execution environment
      executionEnvironment: 'Docker Container',
      storageProvider: 'IPFS',
      verificationMethod: 'hash comparison',
    },
  });

  const [isCreating, setIsCreating] = useState(false);
  const [creationResult, setCreationResult] = useState(null);
  const createInFlightRef = useRef(false);
  const [connectedWallet, setConnectedWallet] = useState(() =>
    walletProviderManager.getCurrentWallet(),
  );

  useEffect(() => {
    const syncWallet = () => {
      setConnectedWallet(walletProviderManager.getCurrentWallet());
    };

    syncWallet();
    walletProviderManager.on('walletConnected', syncWallet);
    walletProviderManager.on('walletDisconnected', syncWallet);
    walletProviderManager.on('accountsChanged', syncWallet);

    return () => {
      walletProviderManager.off('walletConnected', syncWallet);
      walletProviderManager.off('walletDisconnected', syncWallet);
      walletProviderManager.off('accountsChanged', syncWallet);
    };
  }, []);

  const handleInputChange = e => {
    if (isCreating) {
      return;
    }

    const { name, value, type, checked } = e.target;

    if (name.startsWith('computational.')) {
      const specName = name.split('.')[1];
      setNftData({
        ...nftData,
        computationalSpecs: {
          ...nftData.computationalSpecs,
          [specName]: type === 'checkbox' ? checked : value,
        },
      });
    } else {
      setNftData({
        ...nftData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const addAttribute = () => {
    if (isCreating) {
      return;
    }

    if (attributeName && attributeValue) {
      setNftData({
        ...nftData,
        attributes: [
          ...nftData.attributes,
          { trait_type: attributeName, value: attributeValue },
        ],
      });
      setAttributeName('');
      setAttributeValue('');
    }
  };

  const [attributeName, setAttributeName] = useState('');
  const [attributeValue, setAttributeValue] = useState('');

  const handleCreateNft = async () => {
    if (createInFlightRef.current) {
      return;
    }

    const trimmedName = nftData.name.trim();

    if (!trimmedName) {
      setCreationResult({
        success: false,
        error: 'Please enter a name for your NFT.',
      });
      return;
    }

    if (!connectedWallet?.account) {
      setCreationResult({
        success: false,
        error:
          'Connect a wallet provider before creating an NFT. Private key entry is not supported.',
      });
      return;
    }

    setIsCreating(true);
    createInFlightRef.current = true;
    setCreationResult(null);

    try {
      const timestamp = new Date().toISOString();
      const mintPayload = {
        ...nftData,
        name: trimmedName,
        image: nftData.imageUrl,
        creator: connectedWallet.account,
      };

      const signingPayload = JSON.stringify({
        action: 'wrfcoin.nft.create',
        creator: connectedWallet.account,
        timestamp,
        nft: mintPayload,
      });

      const signature = await walletProviderManager.signNftCreate(signingPayload);
      if (typeof signature !== 'string' || signature.trim().length < 10) {
        throw new Error('Wallet provider returned an invalid signature.');
      }

      const latestWallet = walletProviderManager.getCurrentWallet();
      if (!latestWallet?.account || latestWallet.account !== connectedWallet.account) {
        throw new Error('Connected wallet changed during signing. Please retry.');
      }

      const mintedNft = await nftAPI.createNFT({
        ...mintPayload,
        signingPayload,
        signature,
        signedAt: timestamp,
      });

      setCreationResult({
        success: true,
        data: {
          nft: mintedNft,
        },
      });
    } catch (error) {
      const errorMessage = error?.message || '';
      let userFacingError = 'Failed to create NFT. Please try again.';

      if (/wallet changed during signing/i.test(errorMessage)) {
        userFacingError =
          'Connected wallet changed during signing. Reconnect and try again.';
      } else if (/sign/i.test(errorMessage)) {
        userFacingError =
          'Wallet signing failed. Approve the signature request and try again.';
      } else if (
        /wallet|provider|connect/i.test(errorMessage)
      ) {
        userFacingError =
          'Connect a wallet provider and retry NFT creation.';
      }

      setCreationResult({
        success: false,
        error: userFacingError,
      });
    } finally {
      setIsCreating(false);
      createInFlightRef.current = false;
    }
  };

  return (
    <div className="create-nft">
      <h2 className="dashboard-title mb-4">Create NFT</h2>

      {creationResult && (
        <Alert severity={creationResult.success ? 'success' : 'error'} sx={{ mb: 4 }}>
          {creationResult.success ? (
            <>
              <AlertTitle>NFT Created Successfully!</AlertTitle>
              <Typography variant="body2">Your NFT has been minted to the blockchain.</Typography>
              <hr />
              <Typography variant="body2">
                Transaction ID:{' '}
                <strong>
                  {creationResult.data?.nft?.creation_tx ||
                    creationResult.data?.nft?.transactionHash ||
                    creationResult.data?.nft?.txHash ||
                    'Pending confirmation'}
                </strong>
              </Typography>
            </>
          ) : (
            <>
              <AlertTitle>NFT Creation Failed</AlertTitle>
              <Typography variant="body2">{creationResult.error}</Typography>
            </>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <WrfCard title="Create New NFT">
            <Box>
              <Box sx={{ mb: 3 }}>
                <Alert severity={connectedWallet?.account ? 'success' : 'warning'}>
                  {connectedWallet?.account ? (
                    <Typography variant="body2">
                      Wallet connected: <strong>{connectedWallet.account}</strong>.
                      NFT creation will be signed by your wallet provider.
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      Connect a wallet provider to sign NFT creation. Raw private
                      key entry is disabled for security.
                    </Typography>
                  )}
                </Alert>
              </Box>

              <Box sx={{ mb: 3 }}>
                <WrfSelect
                  label="NFT Type"
                  value={nftData.nftType}
                  onChange={(newVal) => handleInputChange({ target: { name: 'nftType', value: newVal, type: 'select' } })}
                  disabled={isCreating}
                  options={[
                    { value: 'Art', label: 'Art' },
                    { value: 'ComputationalResource', label: 'Computational Resource' },
                    { value: 'WeatherModel', label: 'Weather Model (GFS/WRF)' },
                    { value: 'ClimateModel', label: 'Climate Model' },
                    { value: 'AirQualityModel', label: 'Air Quality Simulation' },
                    { value: 'Document', label: 'Document' },
                    { value: 'Music', label: 'Music' },
                    { value: 'Video', label: 'Video' },
                    { value: 'GameItem', label: 'Game Item' },
                  ]}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Name"
                  placeholder="Enter NFT name"
                  value={nftData.name}
                  onChange={handleInputChange}
                  disabled={isCreating}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  id="description"
                  name="description"
                  label="Description"
                  placeholder="Enter NFT description"
                  value={nftData.description}
                  onChange={handleInputChange}
                  disabled={isCreating}
                  multiline
                  rows={3}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  id="imageUrl"
                  name="imageUrl"
                  label="Image URL"
                  placeholder="Enter image URL or IPFS hash"
                  value={nftData.imageUrl}
                  onChange={handleInputChange}
                  disabled={isCreating}
                  size="small"
                />
              </Box>

              <div className="form-group mb-3">
                <label htmlFor="royaltyPercentage" className="form-label">
                  Royalty Percentage ({nftData.royaltyPercentage}%)
                </label>
                <input
                  type="range"
                  id="royaltyPercentage"
                  name="royaltyPercentage"
                  className="form-range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={nftData.royaltyPercentage}
                  onChange={handleInputChange}
                  disabled={isCreating}
                />
              </div>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Attributes</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Trait name"
                    value={attributeName}
                    onChange={e => setAttributeName(e.target.value)}
                    disabled={isCreating}
                  />
                  <TextField
                    size="small"
                    placeholder="Value"
                    value={attributeValue}
                    onChange={e => setAttributeValue(e.target.value)}
                    disabled={isCreating}
                  />
                  <Button
                    variant="outlined"
                    onClick={addAttribute}
                    disabled={isCreating}
                  >
                    Add
                  </Button>
                </Box>

                {nftData.attributes.length > 0 ? (
                  <Box sx={{ mt: 1 }}>
                    {nftData.attributes.map((attr, index) => (
                      <Chip
                        key={index}
                        label={`${attr.trait_type}: ${attr.value}`}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">No attributes added yet.</Typography>
                )}
              </Box>

              {nftData.nftType === 'ComputationalResource' && (
                <Box className="computational-specs" sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Computational Specifications</Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        id="computational.computePower"
                        name="computational.computePower"
                        label="Compute Power (FLOPS)"
                        placeholder="Compute power in FLOPS"
                        value={nftData.computationalSpecs.computePower}
                        onChange={handleInputChange}
                        disabled={isCreating}
                        size="small"
                        sx={{ mb: 3 }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        id="computational.memory"
                        name="computational.memory"
                        label="Memory (MB)"
                        placeholder="Memory in MB"
                        value={nftData.computationalSpecs.memory}
                        onChange={handleInputChange}
                        disabled={isCreating}
                        size="small"
                        sx={{ mb: 3 }}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        id="computational.storage"
                        name="computational.storage"
                        label="Storage (MB)"
                        placeholder="Storage in MB"
                        value={nftData.computationalSpecs.storage}
                        onChange={handleInputChange}
                        disabled={isCreating}
                        size="small"
                        sx={{ mb: 3 }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        id="computational.duration"
                        name="computational.duration"
                        label="Duration (days)"
                        placeholder="Duration in days"
                        value={nftData.computationalSpecs.duration}
                        onChange={handleInputChange}
                        disabled={isCreating}
                        size="small"
                        sx={{ mb: 3 }}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mb: 3 }}>
                    <label>
                      <input
                        type="checkbox"
                        id="computational.renewable"
                        name="computational.renewable"
                        checked={nftData.computationalSpecs.renewable}
                        onChange={handleInputChange}
                        disabled={isCreating}
                        style={{ marginRight: '8px' }}
                      />
                      Renewable
                    </label>
                    <Typography variant="caption" display="block" color="text.secondary">
                      If checked, this resource can be renewed after expiration.
                    </Typography>
                  </Box>
                </Box>
              )}

              <Button
                variant="contained"
                fullWidth
                onClick={handleCreateNft}
                disabled={isCreating || !nftData.name.trim() || !connectedWallet?.account}
              >
                {isCreating ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Creating NFT...
                  </>
                ) : (
                  'Create NFT'
                )}
              </Button>
            </Box>
          </WrfCard>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <WrfCard title="NFT Preview">
            <Box>
              <div className="nft-preview-container">
                {nftData.imageUrl ? (
                  <img
                    src={nftData.imageUrl}
                    alt={nftData.name}
                    className="nft-preview-image img-fluid mb-3"
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src =
                        '/placeholder-nft.svg';
                    }}
                  />
                ) : (
                  <div className="nft-preview-placeholder mb-3">
                    <i className="bi bi-image display-1"></i>
                    <p className="mt-3">No image URL provided</p>
                  </div>
                )}

                <div className="nft-preview-details">
                  <h3 className="nft-preview-name">
                    {nftData.name || 'Unnamed NFT'}
                  </h3>

                  <p className="nft-preview-description">
                    {nftData.description || 'No description provided.'}
                  </p>

                  <Box sx={{ mb: 2 }}>
                    <Chip label={nftData.nftType} color="primary" size="small" />
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 2 }}>
                      Royalty: {nftData.royaltyPercentage}%
                    </Typography>
                  </Box>

                  {nftData.attributes.length > 0 && (
                    <div className="nft-preview-attributes">
                      <h6>Attributes:</h6>
                      <div className="nft-attributes-grid">
                        {nftData.attributes.map((attr, index) => (
                          <div key={index} className="nft-attribute-item">
                            <span className="nft-attribute-name">
                              {attr.trait_type}
                            </span>
                            <span className="nft-attribute-value">
                              {attr.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(nftData.nftType === 'ComputationalResource' ||
                    nftData.nftType === 'WeatherModel' ||
                    nftData.nftType === 'ClimateModel' ||
                    nftData.nftType === 'AirQualityModel') && (
                    <div className="nft-preview-computational mt-3">
                      <h6>
                        {nftData.nftType === 'WeatherModel'
                          ? 'Weather Model Specifications:'
                          : nftData.nftType === 'ClimateModel'
                            ? 'Climate Model Specifications:'
                            : nftData.nftType === 'AirQualityModel'
                              ? 'Air Quality Model Specifications:'
                              : 'Computational Specifications:'}
                      </h6>
                      <div className="nft-specs-grid">
                        <div className="nft-spec-item">
                          <span className="nft-spec-name">Compute Power:</span>
                          <span className="nft-spec-value">
                            {nftData.computationalSpecs.computePower} FLOPS
                          </span>
                        </div>
                        <div className="nft-spec-item">
                          <span className="nft-spec-name">Memory:</span>
                          <span className="nft-spec-value">
                            {nftData.computationalSpecs.memory} MB
                          </span>
                        </div>
                        <div className="nft-spec-item">
                          <span className="nft-spec-name">Storage:</span>
                          <span className="nft-spec-value">
                            {nftData.computationalSpecs.storage} MB
                          </span>
                        </div>
                        <div className="nft-spec-item">
                          <span className="nft-spec-name">Duration:</span>
                          <span className="nft-spec-value">
                            {nftData.computationalSpecs.duration} days
                          </span>
                        </div>
                        <div className="nft-spec-item">
                          <span className="nft-spec-name">Renewable:</span>
                          <span className="nft-spec-value">
                            {nftData.computationalSpecs.renewable
                              ? 'Yes'
                              : 'No'}
                          </span>
                        </div>

                        {/* Weather model specific specs */}
                        {(nftData.nftType === 'WeatherModel' ||
                          nftData.nftType === 'ClimateModel' ||
                          nftData.nftType === 'AirQualityModel') &&
                          nftData.computationalSpecs.modelType && (
                          <div className="nft-spec-item">
                            <span className="nft-spec-name">Model Type:</span>
                            <span className="nft-spec-value">
                              {nftData.computationalSpecs.modelType}
                            </span>
                          </div>
                        )}

                        {(nftData.nftType === 'WeatherModel' ||
                          nftData.nftType === 'ClimateModel' ||
                          nftData.nftType === 'AirQualityModel') &&
                          nftData.computationalSpecs.region && (
                          <div className="nft-spec-item">
                            <span className="nft-spec-name">Region:</span>
                            <span className="nft-spec-value">
                              {nftData.computationalSpecs.region
                                .replace('_', ' ')
                                .replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        )}

                        {(nftData.nftType === 'WeatherModel' ||
                          nftData.nftType === 'ClimateModel' ||
                          nftData.nftType === 'AirQualityModel') &&
                          nftData.computationalSpecs.resolution && (
                          <div className="nft-spec-item">
                            <span className="nft-spec-name">Resolution:</span>
                            <span className="nft-spec-value">
                              {nftData.computationalSpecs.resolution
                                .replace('_', ' ')
                                .replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        )}

                        {(nftData.nftType === 'WeatherModel' ||
                          nftData.nftType === 'ClimateModel' ||
                          nftData.nftType === 'AirQualityModel') &&
                          nftData.computationalSpecs.forecastLength && (
                          <div className="nft-spec-item">
                            <span className="nft-spec-name">
                                Forecast Length:
                            </span>
                            <span className="nft-spec-value">
                              {nftData.computationalSpecs.forecastLength} days
                            </span>
                          </div>
                        )}

                        {nftData.computationalSpecs.executionEnvironment && (
                          <div className="nft-spec-item">
                            <span className="nft-spec-name">Execution:</span>
                            <span className="nft-spec-value">
                              {nftData.computationalSpecs.executionEnvironment}
                            </span>
                          </div>
                        )}

                        {nftData.computationalSpecs.storageProvider && (
                          <div className="nft-spec-item">
                            <span className="nft-spec-name">Storage:</span>
                            <span className="nft-spec-value">
                              {nftData.computationalSpecs.storageProvider}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Box>
          </WrfCard>
        </Grid>
      </Grid>
    </div>
  );
};

export default CreateNft;
