import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Chip,
  Tabs,
  Tab,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import { nftAPI } from '../../services/api';
import { WrfCard } from '../DesignSystem';
import './NFTDetails.css';

const NFTDetails = ({ nftId, onClose }) => {
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchNFTDetails = async () => {
      try {
        setLoading(true);
        const data = await nftAPI.getNFTDetails(nftId);
        setNft(data);
        setError(null);
      } catch (err) {
        console.error(`Error fetching NFT ${nftId}:`, err);
        setError('Failed to load NFT details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (nftId) {
      fetchNFTDetails();
    }
  }, [nftId]);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', my: 5 }}>
        <CircularProgress />
        <Typography sx={{ mt: 3 }}>Loading NFT details...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!nft) {
    return <Alert severity="warning">NFT not found</Alert>;
  }

  // Format the resource requirements for display
  const resourceRequirements = typeof nft.resourceRequirements === 'string'
    ? JSON.parse(nft.resourceRequirements)
    : nft.resourceRequirements;

  // Format the parameters for display
  const parameters = typeof nft.parameters === 'string'
    ? JSON.parse(nft.parameters)
    : nft.parameters;

  return (
    <div className="nft-details-container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" className="nft-title">{nft.title}</Typography>
        {onClose && (
          <Button
            size="small"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </Button>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Details" value="details" />
          <Tab label="Computation" value="computation" />
          <Tab label="Results" value="results" />
          <Tab label="Verification" value="verification" />
        </Tabs>
      </Box>

      <div className="tab-content">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="nft-detail-tab">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <WrfCard title="NFT Information">
                  <Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Description</Typography>
                      <Typography>{nft.description}</Typography>
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 4 }}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <div className="detail-item">
                          <span className="detail-label">NFT ID</span>
                          <span className="detail-value">{nft.nftId}</span>
                        </div>

                        <div className="detail-item">
                          <span className="detail-label">Computation Type</span>
                          <span className="detail-value">{nft.computationType}</span>
                        </div>

                        {nft.computationModel && (
                          <div className="detail-item">
                            <span className="detail-label">Model</span>
                            <span className="detail-value">{nft.computationModel}</span>
                          </div>
                        )}

                        {nft.modelVersion && (
                          <div className="detail-item">
                            <span className="detail-label">Model Version</span>
                            <span className="detail-value">{nft.modelVersion}</span>
                          </div>
                        )}
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <div className="detail-item">
                          <span className="detail-label">Status</span>
                          <Chip
                            label={nft.status}
                            size="small"
                            color={nft.status === 'ACTIVE' ? 'success' : nft.status === 'COMPLETED' ? 'primary' : 'default'}
                          />
                        </div>

                        <div className="detail-item">
                          <span className="detail-label">Creation Date</span>
                          <span className="detail-value">
                            {new Date(nft.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="detail-item">
                          <span className="detail-label">Token Standard</span>
                          <span className="detail-value">{nft.tokenStandard}</span>
                        </div>

                        <div className="detail-item">
                          <span className="detail-label">Verified</span>
                          <span className="detail-value">{nft.isVerified ? 'Yes' : 'No'}</span>
                        </div>
                      </Grid>
                    </Grid>

                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Weather & Climate Specifications</Typography>
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                      {nft.region && (
                        <Grid size={{ xs: 12, md: 6 }}>
                          <div className="detail-item">
                            <span className="detail-label">Region</span>
                            <span className="detail-value">{nft.region}</span>
                          </div>
                        </Grid>
                      )}

                      {nft.resolution && (
                        <Grid size={{ xs: 12, md: 6 }}>
                          <div className="detail-item">
                            <span className="detail-label">Resolution</span>
                            <span className="detail-value">{nft.resolution}</span>
                          </div>
                        </Grid>
                      )}

                      {nft.forecastLength && (
                        <Grid size={{ xs: 12, md: 6 }}>
                          <div className="detail-item">
                            <span className="detail-label">Forecast Length</span>
                            <span className="detail-value">{nft.forecastLength} days</span>
                          </div>
                        </Grid>
                      )}

                      {nft.updateFrequency && (
                        <Grid size={{ xs: 12, md: 6 }}>
                          <div className="detail-item">
                            <span className="detail-label">Update Frequency</span>
                            <span className="detail-value">{nft.updateFrequency}</span>
                          </div>
                        </Grid>
                      )}
                    </Grid>

                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Ownership Information</Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <div className="detail-item">
                          <span className="detail-label">Creator</span>
                          <span className="detail-value address">{nft.creator}</span>
                        </div>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <div className="detail-item">
                          <span className="detail-label">Current Owner</span>
                          <span className="detail-value address">{nft.owner}</span>
                        </div>
                      </Grid>
                    </Grid>
                  </Box>
                </WrfCard>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <WrfCard title="Execution Environment">
                  <Box>
                    <div className="detail-item">
                      <span className="detail-label">Environment</span>
                      <span className="detail-value">{nft.executionEnvironment}</span>
                    </div>

                    {nft.storageProvider && (
                      <div className="detail-item">
                        <span className="detail-label">Storage Provider</span>
                        <span className="detail-value">{nft.storageProvider}</span>
                      </div>
                    )}

                    <Typography variant="subtitle2" sx={{ mt: 4, mb: 1 }}>Resource Requirements</Typography>
                    {resourceRequirements && (
                      <div className="resource-requirements">
                        {Object.entries(resourceRequirements).map(([key, value]) => (
                          <div key={key} className="detail-item">
                            <span className="detail-label">{key}</span>
                            <span className="detail-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {parameters && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 4, mb: 1 }}>Computation Parameters</Typography>
                        <div className="parameters">
                          {Object.entries(parameters).map(([key, value]) => (
                            <div key={key} className="detail-item">
                              <span className="detail-label">{key}</span>
                              <span className="detail-value">
                                {typeof value === 'object' ? JSON.stringify(value) : value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </Box>
                </WrfCard>

                <Box sx={{ mt: 3 }}>
                  <Button variant="contained" fullWidth sx={{ mb: 1 }}>Execute Computation</Button>
                  {nft.owner === 'YOUR_WALLET_ADDRESS' && ( // Replace with actual wallet check
                    <Button variant="outlined" fullWidth>Transfer Ownership</Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </div>
        )}

        {/* Computation Tab */}
        {activeTab === 'computation' && (
          <div className="nft-computation-tab">
            <WrfCard title="Computation Details">
              <Box>
                <Typography sx={{ mb: 4 }}>This section displays information about the computational task and its execution.</Typography>

                <h6>Input Data</h6>
                {nft.inputData ? (
                  <div className="code-block mb-4">{nft.inputData}</div>
                ) : (
                  <Typography color="text.secondary" sx={{ mb: 4 }}>No input data available</Typography>
                )}

                {nft.inputDataHash && (
                  <div className="detail-item mb-3">
                    <span className="detail-label">Input Data Hash</span>
                    <span className="detail-value hash">{nft.inputDataHash}</span>
                  </div>
                )}

                <h6 className="mt-4">Execution Timeline</h6>
                <div className="timeline mb-4">
                  <div className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h6>Created</h6>
                      <p>{new Date(nft.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {nft.status === 'PROCESSING' && (
                    <div className="timeline-item">
                      <div className="timeline-marker processing"></div>
                      <div className="timeline-content">
                        <h6>Processing</h6>
                        <p>Computation in progress...</p>
                      </div>
                    </div>
                  )}

                  {nft.status === 'COMPLETED' && nft.completedAt && (
                    <div className="timeline-item">
                      <div className="timeline-marker completed"></div>
                      <div className="timeline-content">
                        <h6>Completed</h6>
                        <p>{new Date(nft.completedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {nft.executor && (
                  <div className="detail-item">
                    <span className="detail-label">Executed By</span>
                    <span className="detail-value address">{nft.executor}</span>
                  </div>
                )}
              </Box>
            </WrfCard>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="nft-results-tab">
            <WrfCard title="Computation Results">
              <Box>
                {nft.status === 'COMPLETED' ? (
                  <>
                    <Alert severity="success" sx={{ mb: 4 }}>
                      This NFT computation has been completed successfully!
                    </Alert>

                    <h6>Result Data</h6>
                    {nft.result ? (
                      <div className="code-block mb-4">{nft.result}</div>
                    ) : (
                      <Typography color="text.secondary" sx={{ mb: 4 }}>No result data available</Typography>
                    )}

                    {nft.resultHash && (
                      <div className="detail-item mb-4">
                        <span className="detail-label">Result Hash</span>
                        <span className="detail-value hash">{nft.resultHash}</span>
                      </div>
                    )}

                    {nft.executionResultHash && (
                      <div className="detail-item mb-4">
                        <span className="detail-label">Execution Result Hash</span>
                        <span className="detail-value hash">{nft.executionResultHash}</span>
                      </div>
                    )}

                    {nft.resultTx && (
                      <div className="blockchain-tx mb-4">
                        <h6>Blockchain Transaction</h6>
                        <a href="#" className="tx-link">
                          {nft.resultTx}
                        </a>
                      </div>
                    )}

                    <Box sx={{ mt: 4 }}>
                      <Button variant="outlined" sx={{ mr: 2 }}>Download Results</Button>
                      <Button variant="contained">Verify Results</Button>
                    </Box>
                  </>
                ) : (
                  <Alert severity="info">
                    No results available yet. The computation is {nft.status.toLowerCase()}.
                  </Alert>
                )}
              </Box>
            </WrfCard>
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div className="nft-verification-tab">
            <WrfCard title="Verification Information">
              <Box>
                <Alert severity={nft.isVerified ? 'success' : 'warning'} className="verification-status" sx={{ mb: 4 }}>
                  {nft.isVerified ? (
                    <>
                      <Typography variant="subtitle2">Verified</Typography>
                      <Typography variant="body2">This NFT computation has been verified as authentic and accurate.</Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="subtitle2">Not Verified</Typography>
                      <Typography variant="body2">This NFT computation has not been verified yet.</Typography>
                    </>
                  )}
                </Alert>

                <h6>Verifiers</h6>
                {nft.verifiers && nft.verifiers.length > 0 ? (
                  <div className="verifiers-list mb-4">
                    {nft.verifiers.map((verifier, index) => (
                      <div key={index} className="verifier-item">
                        <div className="verifier-address">{verifier.verifier}</div>
                        <div className="verifier-time">
                          {new Date(verifier.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Typography color="text.secondary" sx={{ mb: 4 }}>No verifiers yet</Typography>
                )}

                {nft.verificationSignatures && Object.keys(nft.verificationSignatures).length > 0 && (
                  <>
                    <h6>Verification Signatures</h6>
                    <div className="signatures-list mb-4">
                      {Object.entries(nft.verificationSignatures).map(([verifier, signature]) => (
                        <div key={verifier} className="signature-item">
                          <div className="signature-verifier">{verifier}</div>
                          <div className="signature-value">{signature}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {nft.status === 'COMPLETED' && !nft.isVerified && (
                  <Button variant="contained">Submit Verification</Button>
                )}
              </Box>
            </WrfCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTDetails;
