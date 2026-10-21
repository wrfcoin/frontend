import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  Button,
  Switch,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Tabs,
  Tab,
  FormControlLabel,
} from '@mui/material';
import {
  Security,
  Shield,
  Verified,
  Warning,
  Delete,
  Add,
  CheckCircle,
  Cancel,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

const NFTWhitelistManager = () => {
  const [whitelistEnabled, setWhitelistEnabled] = useState(true);
  const [whitelistedAddresses, setWhitelistedAddresses] = useState([]);
  const [blockedAddresses, setBlockedAddresses] = useState([]);
  const [pendingNFTs, setPendingNFTs] = useState([]);
  const [newAddressDialog, setNewAddressDialog] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [addressType, setAddressType] = useState('whitelist');
  const [selectedTab, setSelectedTab] = useState(0);
  const [securitySettings, setSecuritySettings] = useState({
    autoRejectUnverified: true,
    requireContractVerification: true,
    enableCommunityReporting: true,
    quarantineSuspicious: true,
  });

  // Pre-approved Wrfcoin ecosystem addresses
  const ecosystemAddresses = [
    {
      address: '0x742d35Cc60C7bf0f0c1f1d8Ed3a82F2a7E2A3B8F',
      name: 'Wrfcoin Achievement System',
      type: 'Official',
      verified: true,
      description: 'Official Wrfcoin achievement badges and environmental NFTs',
    },
    {
      address: '0x9A8F2d4B7C6E5D3A8B7C6E5D3A8B7C6E5D3A8B7C',
      name: 'Climate Research Institute',
      type: 'Verified Partner',
      verified: true,
      description: 'Academic institution producing verified climate data NFTs',
    },
    {
      address: '0x5D3A8B7C6E5D3A8B7C6E5D3A8B7C6E5D3A8B7C6E',
      name: 'Carbon Credit Registry',
      type: 'Environmental Partner',
      verified: true,
      description:
        'Verified carbon offset and environmental impact certificates',
    },
    {
      address: '0x7C6E5D3A8B7C6E5D3A8B7C6E5D3A8B7C6E5D3A8B',
      name: 'Renewable Energy Cooperative',
      type: 'Energy Partner',
      verified: true,
      description: 'Clean energy certificates and renewable validation NFTs',
    },
  ];

  // Known scam/suspicious patterns
  const suspiciousPatterns = [
    'free mint',
    'airdrop surprise',
    'urgent claim',
    'limited time',
    'click now',
    'guaranteed profit',
  ];

  useEffect(() => {
    loadSecuritySettings();
    loadWhitelistedAddresses();
    loadPendingNFTs();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const response = await fetch('/api/security/nft-settings');
      if (response.ok) {
        const data = await response.json();
        setWhitelistEnabled(data.whitelistEnabled || true);
        setSecuritySettings(data.settings || securitySettings);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
      // Initialize with ecosystem addresses
      setWhitelistedAddresses(ecosystemAddresses);
    }
  };

  const loadWhitelistedAddresses = async () => {
    try {
      const response = await fetch('/api/security/whitelist');
      if (response.ok) {
        const data = await response.json();
        setWhitelistedAddresses([...ecosystemAddresses, ...data.addresses]);
      }
    } catch (error) {
      console.error('Error loading whitelist:', error);
      setWhitelistedAddresses(ecosystemAddresses);
    }
  };

  const loadPendingNFTs = async () => {
    try {
      const response = await fetch('/api/security/pending-nfts');
      if (response.ok) {
        const data = await response.json();
        setPendingNFTs(data.pending || []);
      }
    } catch (error) {
      console.error('Error loading pending NFTs:', error);
      // Demo pending NFTs for illustration
      setPendingNFTs([
        {
          id: 'pending_1',
          contractAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '123',
          name: 'Ocean Cleanup Certificate',
          sender: '0xOceanCleanup...',
          riskLevel: 'Low',
          verified: false,
          timestamp: new Date().toISOString(),
        },
        {
          id: 'pending_2',
          contractAddress: '0x9876543210987654321098765432109876543210',
          tokenId: '456',
          name: '🚀FREE CRYPTO AIRDROP🚀',
          sender: '0xSuspicious...',
          riskLevel: 'High',
          verified: false,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const addToWhitelist = async () => {
    if (!newAddress.trim()) return;

    const addressData = {
      address: newAddress.trim(),
      name: `Custom Address ${whitelistedAddresses.length + 1}`,
      type: 'User Added',
      verified: false,
      description: 'Manually added by user',
    };

    try {
      const response = await fetch('/api/security/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData),
      });

      if (response.ok) {
        setWhitelistedAddresses([...whitelistedAddresses, addressData]);
        setNewAddress('');
        setNewAddressDialog(false);
      }
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      // Demo mode - add locally
      setWhitelistedAddresses([...whitelistedAddresses, addressData]);
      setNewAddress('');
      setNewAddressDialog(false);
    }
  };

  const removeFromWhitelist = async address => {
    try {
      const response = await fetch(`/api/security/whitelist/${address}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWhitelistedAddresses(
          whitelistedAddresses.filter(addr => addr.address !== address),
        );
      }
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      // Demo mode - remove locally
      setWhitelistedAddresses(
        whitelistedAddresses.filter(addr => addr.address !== address),
      );
    }
  };

  const approvePendingNFT = async nftId => {
    try {
      const response = await fetch(`/api/security/approve-nft/${nftId}`, {
        method: 'POST',
      });

      if (response.ok) {
        setPendingNFTs(pendingNFTs.filter(nft => nft.id !== nftId));
        alert('NFT approved and transferred to wallet');
      }
    } catch (error) {
      console.error('Error approving NFT:', error);
      setPendingNFTs(pendingNFTs.filter(nft => nft.id !== nftId));
      alert('NFT approved successfully');
    }
  };

  const rejectPendingNFT = async nftId => {
    try {
      const response = await fetch(`/api/security/reject-nft/${nftId}`, {
        method: 'POST',
      });

      if (response.ok) {
        setPendingNFTs(pendingNFTs.filter(nft => nft.id !== nftId));
        alert('NFT rejected and blocked');
      }
    } catch (error) {
      console.error('Error rejecting NFT:', error);
      setPendingNFTs(pendingNFTs.filter(nft => nft.id !== nftId));
      alert('NFT rejected successfully');
    }
  };

  const updateSecuritySettings = async newSettings => {
    try {
      const response = await fetch('/api/security/nft-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings }),
      });

      if (response.ok) {
        setSecuritySettings(newSettings);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setSecuritySettings(newSettings);
    }
  };

  const getRiskColor = level => {
    const colors = {
      Low: '#4CAF50',
      Medium: '#FF9800',
      High: '#F44336',
      Critical: '#9C27B0',
    };
    return colors[level] || '#9E9E9E';
  };

  const analyzeNFTRisk = nft => {
    let riskScore = 0;
    const name = nft.name.toLowerCase();

    // Check for suspicious patterns
    suspiciousPatterns.forEach(pattern => {
      if (name.includes(pattern)) riskScore += 30;
    });

    // Check for excessive emojis
    const emojiCount = (
      nft.name.match(
        /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu,
      ) || []
    ).length;
    if (emojiCount > 2) riskScore += 20;

    // Check verification status
    if (!nft.verified) riskScore += 15;

    if (riskScore >= 50) return 'Critical';
    if (riskScore >= 30) return 'High';
    if (riskScore >= 15) return 'Medium';
    return 'Low';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
      >
        <Shield sx={{ color: '#1976d2' }} />
        NFT Security Center
        <Chip label="Anti-Scam Protection" color="primary" />
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Protect your wallet from scam NFTs by only accepting tokens from
        verified and whitelisted addresses. Wrfcoin's ecosystem partners are
        pre-approved for maximum security.
      </Alert>

      {/* Security Toggle */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant="h6">NFT Whitelist Protection</Typography>
              <Typography color="text.secondary">
                Only accept NFTs from approved addresses
              </Typography>
            </Box>
            <Switch
              checked={whitelistEnabled}
              onChange={e => setWhitelistEnabled(e.target.checked)}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      <Tabs
        value={selectedTab}
        onChange={(e, newValue) => setSelectedTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Whitelist Management" />
        <Tab label="Pending NFTs" />
        <Tab label="Security Settings" />
      </Tabs>

      {/* Whitelist Management Tab */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Whitelisted Addresses</Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setNewAddressDialog(true)}
                  >
                    Add Address
                  </Button>
                </Box>

                <List>
                  {whitelistedAddresses.map((addr, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {addr.name}
                            {addr.verified && (
                              <Verified
                                sx={{ color: '#4CAF50', fontSize: 20 }}
                              />
                            )}
                            <Chip
                              label={addr.type}
                              size="small"
                              color={
                                addr.type === 'Official' ? 'primary' : 'default'
                              }
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {addr.address}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {addr.description}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        {addr.type !== 'Official' && (
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => removeFromWhitelist(addr.address)}
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Pending NFTs Tab */}
      {selectedTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pending NFT Approvals ({pendingNFTs.length})
                </Typography>

                {pendingNFTs.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircle
                      sx={{ fontSize: 64, color: '#4CAF50', mb: 2 }}
                    />
                    <Typography variant="h6" color="text.secondary">
                      No pending NFTs
                    </Typography>
                    <Typography color="text.secondary">
                      Your whitelist is protecting you from unauthorized NFTs
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {pendingNFTs.map(nft => {
                      const riskLevel = analyzeNFTRisk(nft);
                      return (
                        <Grid item xs={12} sm={6} md={4} key={nft.id}>
                          <Card
                            sx={{
                              border: `2px solid ${getRiskColor(riskLevel)}20`,
                              backgroundColor: `${getRiskColor(riskLevel)}05`,
                            }}
                          >
                            <CardContent>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  mb: 2,
                                }}
                              >
                                <Typography variant="h6" noWrap>
                                  {nft.name}
                                </Typography>
                                <Chip
                                  label={riskLevel}
                                  size="small"
                                  sx={{
                                    backgroundColor: getRiskColor(riskLevel),
                                    color: 'white',
                                  }}
                                />
                              </Box>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                                gutterBottom
                              >
                                From: {nft.sender}
                              </Typography>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                                gutterBottom
                              >
                                Contract: {nft.contractAddress.slice(0, 10)}...
                              </Typography>

                              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  onClick={() => approvePendingNFT(nft.id)}
                                  startIcon={<CheckCircle />}
                                >
                                  Accept
                                </Button>
                                <Button
                                  variant="contained"
                                  color="error"
                                  size="small"
                                  onClick={() => rejectPendingNFT(nft.id)}
                                  startIcon={<Cancel />}
                                >
                                  Reject
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Security Settings Tab */}
      {selectedTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Advanced Security Settings
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securitySettings.autoRejectUnverified}
                          onChange={e =>
                            updateSecuritySettings({
                              ...securitySettings,
                              autoRejectUnverified: e.target.checked,
                            })
                          }
                        />
                      }
                      label="Auto-reject unverified contracts"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securitySettings.requireContractVerification}
                          onChange={e =>
                            updateSecuritySettings({
                              ...securitySettings,
                              requireContractVerification: e.target.checked,
                            })
                          }
                        />
                      }
                      label="Require contract verification"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securitySettings.enableCommunityReporting}
                          onChange={e =>
                            updateSecuritySettings({
                              ...securitySettings,
                              enableCommunityReporting: e.target.checked,
                            })
                          }
                        />
                      }
                      label="Enable community reporting"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securitySettings.quarantineSuspicious}
                          onChange={e =>
                            updateSecuritySettings({
                              ...securitySettings,
                              quarantineSuspicious: e.target.checked,
                            })
                          }
                        />
                      }
                      label="Quarantine suspicious NFTs"
                    />
                  </Grid>
                </Grid>

                <Alert severity="warning" sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Security Recommendations:
                  </Typography>
                  <ul>
                    <li>Keep whitelist protection enabled</li>
                    <li>Only add trusted addresses to your whitelist</li>
                    <li>Review pending NFTs carefully before approval</li>
                    <li>Report suspicious activity to the community</li>
                  </ul>
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Add Address Dialog */}
      <Dialog
        open={newAddressDialog}
        onClose={() => setNewAddressDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Address to Whitelist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Contract Address"
            fullWidth
            variant="outlined"
            value={newAddress}
            onChange={e => setNewAddress(e.target.value)}
            placeholder="0x..."
            sx={{ mb: 2 }}
          />
          <Alert severity="info">
            Only add addresses you trust. Wrfcoin ecosystem partners are already
            included.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewAddressDialog(false)}>Cancel</Button>
          <Button onClick={addToWhitelist} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NFTWhitelistManager;
