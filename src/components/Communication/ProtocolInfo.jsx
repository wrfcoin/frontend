import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Public as PublicIcon,
  DeviceHub as DeviceHubIcon,
  Timeline as TimelineIcon,
  Groups as GroupsIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';

const ProtocolInfo = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' },
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <SecurityIcon />
          <Typography variant="h5">Wrfcoin Messaging Protocol</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Wrfcoin uses a decentralized, cross-platform messaging protocol that
          works with any compatible wallet or application across multiple
          blockchains.
        </Alert>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PublicIcon color="primary" />
              <Typography variant="h6">Cross-Platform Compatibility</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Your Tony contact doesn't need Wrfcoin Core to receive messages!
              The Wrfcoin messaging protocol works with:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <VerifiedIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Any Web3 wallet with messaging support"
                  secondary="MetaMask, Trust Wallet, Phantom, etc."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <VerifiedIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Other Wrfcoin platform applications"
                  secondary="WrfView, CryptoTrackr, WrfAtlas, WrfSentinel"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <VerifiedIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Compatible DApps and services"
                  secondary="Any application implementing the Wrfcoin messaging standard"
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <DeviceHubIcon color="primary" />
              <Typography variant="h6">Multi-Address Support</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Since Tony has both ETH and SOL addresses, you can choose which
              blockchain to use for messaging:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip label="Ethereum (ETH)" color="primary" variant="outlined" />
              <Chip label="Solana (SOL)" color="secondary" variant="outlined" />
              <Chip label="Polygon" color="info" variant="outlined" />
              <Chip
                label="Binance Smart Chain"
                color="warning"
                variant="outlined"
              />
            </Box>
            <Typography>
              The system automatically selects the best route based on network
              fees, speed, and recipient preferences.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityIcon color="primary" />
              <Typography variant="h6">Signal-Level Security</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="End-to-End Encryption"
                  secondary="ECDH key exchange with AES-256-GCM encryption"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Perfect Forward Secrecy"
                  secondary="Keys are rotated for each conversation"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Zero Server Storage"
                  secondary="Messages are relayed through P2P networks, never stored centrally"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Disappearing Messages"
                  secondary="Optional automatic message deletion after specified time"
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TimelineIcon color="primary" />
              <Typography variant="h6">How Messages Are Delivered</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              <strong>1. Message Creation:</strong> Your message is encrypted
              locally using the recipient's public key.
            </Typography>
            <Typography paragraph>
              <strong>2. Blockchain Relay:</strong> The encrypted message is
              posted to the selected blockchain as a transaction.
            </Typography>
            <Typography paragraph>
              <strong>3. P2P Distribution:</strong> Wrfcoin nodes relay the
              message through our distributed network.
            </Typography>
            <Typography paragraph>
              <strong>4. Recipient Notification:</strong> Compatible
              applications automatically detect and decrypt the message.
            </Typography>
            <Typography>
              <strong>5. Automatic Cleanup:</strong> The message reference is
              removed from the blockchain after delivery confirmation.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <GroupsIcon color="primary" />
              <Typography variant="h6">Network Effects</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              The more applications that adopt the Wrfcoin messaging standard,
              the stronger the network becomes:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Interoperability"
                  secondary="Messages work seamlessly across all compatible platforms"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Enhanced Privacy"
                  secondary="Larger P2P network provides better anonymity and reliability"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Reduced Costs"
                  secondary="Competition between blockchains keeps transaction fees low"
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          sx={{
            background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
            px: 4,
          }}
        >
          Got It!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProtocolInfo;
