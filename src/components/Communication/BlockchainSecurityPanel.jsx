import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Key as KeyIcon,
  Fingerprint as FingerprintIcon,
  VpnKey as VpnKeyIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { devLog } from '../../utils/logger';

const BlockchainSecurityPanel = ({ onSecurityToggle }) => {
  const [securityFeatures, setSecurityFeatures] = useState({
    blockchainKeys: true,
    messageVerification: true,
    timeLockedMessages: false,
    multiSigAuth: false,
    zkProofs: false,
    keyRotation: false,
  });

  const handleFeatureToggle = feature => {
    const newFeatures = {
      ...securityFeatures,
      [feature]: !securityFeatures[feature],
    };
    setSecurityFeatures(newFeatures);
    if (onSecurityToggle) {
      onSecurityToggle(feature, newFeatures[feature]);
    }
  };

  const securityOptions = [
    {
      key: 'blockchainKeys',
      title: 'Blockchain-Derived Keys',
      description:
        'Use blockchain entropy to generate super-secure encryption keys',
      icon: <KeyIcon />,
      enabled: securityFeatures.blockchainKeys,
      level: 'Essential',
    },
    {
      key: 'messageVerification',
      title: 'Cryptographic Verification',
      description: 'Every message gets a blockchain hash for tamper detection',
      icon: <VerifiedIcon />,
      enabled: securityFeatures.messageVerification,
      level: 'Essential',
    },
    {
      key: 'timeLockedMessages',
      title: 'Time-Locked Messages',
      description: 'Messages that can only be read after a specific time',
      icon: <ScheduleIcon />,
      enabled: securityFeatures.timeLockedMessages,
      level: 'Advanced',
    },
    {
      key: 'multiSigAuth',
      title: 'Multi-Signature Authentication',
      description: 'Require multiple approvals for important messages',
      icon: <GroupIcon />,
      enabled: securityFeatures.multiSigAuth,
      level: 'Advanced',
    },
    {
      key: 'zkProofs',
      title: 'Zero-Knowledge Proofs',
      description: 'Prove message authenticity without revealing content',
      icon: <FingerprintIcon />,
      enabled: securityFeatures.zkProofs,
      level: 'Expert',
    },
    {
      key: 'keyRotation',
      title: 'Automatic Key Rotation',
      description:
        'Automatically rotate encryption keys for perfect forward secrecy',
      icon: <VpnKeyIcon />,
      enabled: securityFeatures.keyRotation,
      level: 'Expert',
    },
  ];

  const getSecurityLevel = () => {
    const enabledCount = Object.values(securityFeatures).filter(Boolean).length;
    if (enabledCount >= 5) return { level: 'Maximum', color: 'success' };
    if (enabledCount >= 3) return { level: 'High', color: 'primary' };
    if (enabledCount >= 2) return { level: 'Standard', color: 'warning' };
    return { level: 'Basic', color: 'error' };
  };

  const currentSecurity = getSecurityLevel();

  return (
    <Paper elevation={3} sx={{ p: 3, bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ShieldIcon color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h6" color="text.primary">
            Blockchain Security Features
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Current Level:
            </Typography>
            <Chip
              label={currentSecurity.level}
              color={currentSecurity.color}
              size="small"
              variant="filled"
            />
          </Box>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          These features use the same cryptographic principles that secure
          cryptocurrency networks. Your messages get military-grade protection
          powered by blockchain technology.
        </Typography>
      </Alert>

      <List sx={{ p: 0 }}>
        {securityOptions.map((option, index) => (
          <React.Fragment key={option.key}>
            <ListItem sx={{ px: 0, py: 2 }}>
              <ListItemIcon>{option.icon}</ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">{option.title}</Typography>
                    <Chip
                      label={option.level}
                      size="small"
                      variant="outlined"
                      color={
                        option.level === 'Essential'
                          ? 'success'
                          : option.level === 'Advanced'
                            ? 'primary'
                            : 'secondary'
                      }
                    />
                  </Box>
                }
                secondary={option.description}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={option.enabled}
                    onChange={() => handleFeatureToggle(option.key)}
                    color="primary"
                  />
                }
                label=""
                sx={{ ml: 2 }}
              />
            </ListItem>
            {index < securityOptions.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="subtitle2" color="text.primary" gutterBottom>
          Security Benefits
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <Typography component="li" variant="caption" color="text.secondary">
            Same encryption standards used by Bitcoin and Ethereum
          </Typography>
          <Typography component="li" variant="caption" color="text.secondary">
            Cryptographic proof of message integrity
          </Typography>
          <Typography component="li" variant="caption" color="text.secondary">
            Advanced privacy features beyond traditional messaging
          </Typography>
          <Typography component="li" variant="caption" color="text.secondary">
            Future-proof security that evolves with blockchain technology
          </Typography>
        </Box>
      </Box>

      <Button
        variant="outlined"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
        onClick={() => {
          // Could open advanced security settings
          devLog('Advanced security settings');
        }}
      >
        Advanced Security Settings
      </Button>
    </Paper>
  );
};

export default BlockchainSecurityPanel;
