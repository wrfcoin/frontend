import React, { useState, useEffect } from 'react';
import BlockchainMessagingService from '../../services/blockchainMessaging';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Card,
  CardContent,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Send,
  Lock,
  Verified,
  Timer,
  Search,
  AttachMoney,
  Security,
  Person,
  Add,
} from '@mui/icons-material';
import { devLog } from '../../utils/logger';

const SecureMessagingSample = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [encryptionStatus, setEncryptionStatus] = useState(
    '🔒 End-to-End Encryption Active',
  );
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [newContactBlockchain, setNewContactBlockchain] = useState('ethereum');
  const [blockchainMessaging, setBlockchainMessaging] = useState(null);
  const [isBlockchainConnected, setIsBlockchainConnected] = useState(false);

  // Initialize blockchain messaging service
  useEffect(() => {
    const initBlockchainMessaging = async () => {
      const messagingService = new BlockchainMessagingService();
      setBlockchainMessaging(messagingService);

      try {
        await messagingService.connectWallet();
        setIsBlockchainConnected(true);
        setEncryptionStatus('🔗 Blockchain Messaging Ready');
      } catch (error) {
        devLog('Blockchain messaging available but wallet not connected');
        setEncryptionStatus('🔒 End-to-End Encryption Active');
      }
    };

    initBlockchainMessaging();
  }, []);

  // Initialize with contacts from AddressBook data
  useEffect(() => {
    const addressBookContacts = [
      {
        id: 'contact_eth_1',
        name: 'Tony Stark',
        addresses: [
          {
            address: '0x6858d4d7c8bF5aC2D8F5acc',
            blockchain: 'ethereum',
            label: 'Primary',
          },
        ],
        verified: true,
        lastSeen: '2 hours ago',
        status: 'online',
      },
      {
        id: 'contact_poly_1',
        name: 'Alice Johnson',
        addresses: [
          {
            address: '0x1234567890abcdef1234567890abcdef12345678',
            blockchain: 'ethereum',
            label: 'Main',
          },
        ],
        verified: true,
        lastSeen: '5 minutes ago',
        status: 'online',
      },
    ];
    setContacts(addressBookContacts);
    setSelectedContact(addressBookContacts[0]);

    // Load sample encrypted messages for the first contact
    const sampleMessages = [
      {
        id: 'msg_1',
        content: 'Hey! Ready to discuss the new DeFi protocol implementation?',
        timestamp: Date.now() - 3600000,
        sender: 'them',
        encrypted: true,
        verified: true,
      },
      {
        id: 'msg_2',
        content:
          'Yes, I\'ve been reviewing the smart contract code. Everything looks solid.',
        timestamp: Date.now() - 3000000,
        sender: 'me',
        encrypted: true,
        verified: true,
      },
      {
        id: 'msg_3',
        content:
          'Perfect! Should we schedule a payment for the development fees?',
        timestamp: Date.now() - 1800000,
        sender: 'them',
        encrypted: true,
        verified: true,
      },
    ];
    setMessages(sampleMessages);
  }, []);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    const messageData = {
      id: `msg_${Date.now()}`,
      content: newMessage,
      timestamp: Date.now(),
      sender: 'me',
      encrypted: true,
      verified: true,
    };

    // Add message to local UI immediately
    setMessages(prev => [...prev, messageData]);
    setNewMessage('');

    // Send real blockchain message if service is available
    if (blockchainMessaging && selectedContact.addresses[0]) {
      try {
        const recipientAddress = selectedContact.addresses[0].address;
        devLog('🚀 Sending real blockchain message...');

        const result = await blockchainMessaging.sendMessage(
          recipientAddress,
          newMessage,
        );

        if (result.success) {
          devLog('✅ Message delivered to blockchain network!');
          devLog(
            `📨 Recipient ${selectedContact.name} will receive this in their wallet`,
          );

          // Update message with blockchain delivery confirmation
          setMessages(prev =>
            prev.map(msg =>
              msg.id === messageData.id
                ? {
                  ...msg,
                  blockchainDelivered: true,
                  messageId: result.messageId,
                }
                : msg,
            ),
          );
        }
      } catch (error) {
        console.error('Failed to send blockchain message:', error);
        // Message still shows in UI, but without blockchain delivery
      }
    }
  };

  const sendPaymentRequest = () => {
    if (!paymentAmount || !selectedContact) return;

    const paymentMessage = {
      id: `payment_${Date.now()}`,
      content: `💰 Payment Request: ${paymentAmount} ETH`,
      timestamp: Date.now(),
      sender: 'me',
      encrypted: true,
      verified: true,
      type: 'payment_request',
      amount: paymentAmount,
    };

    setMessages(prev => [...prev, paymentMessage]);
    setShowPaymentDialog(false);
    setPaymentAmount('');
  };

  const createNewChat = () => {
    if (!newContactName || !newContactAddress) return;

    const newContact = {
      id: `contact_${Date.now()}`,
      name: newContactName,
      addresses: [
        {
          address: newContactAddress,
          blockchain: newContactBlockchain,
          label: 'Primary',
        },
      ],
      verified: false,
      lastSeen: 'Just added',
      status: 'offline',
    };

    setContacts(prev => [...prev, newContact]);
    setSelectedContact(newContact);
    setMessages([]);

    // Reset form and close dialog
    setNewContactName('');
    setNewContactAddress('');
    setNewContactBlockchain('ethereum');
    setShowNewChatDialog(false);
  };

  const selectContact = contact => {
    setSelectedContact(contact);
    // In a real implementation, messages would be loaded from encrypted storage
    // For now, we'll show the sample messages for demonstration
  };

  const getStatusColor = status => {
    switch (status) {
    case 'online':
      return '#10b981';
    case 'away':
      return '#f59e0b';
    default:
      return '#6b7280';
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Lock color="primary" />
            Secure Messaging
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              icon={<Security />}
              label={encryptionStatus}
              color="success"
              variant="outlined"
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowNewChatDialog(true)}
              sx={{
                backgroundColor: '#10b981',
                '&:hover': { backgroundColor: '#059669' },
              }}
            >
              NEW CHAT
            </Button>
          </Box>
        </Box>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
          Signal-level encryption • Zero centralized storage • Cross-chain
          payments
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Contacts Panel */}
        <Box
          sx={{
            width: 350,
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search */}
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
          </Box>

          {/* Contact List */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <List sx={{ p: 0 }}>
              {filteredContacts.map(contact => (
                <ListItem key={contact.id} disablePadding>
                  <ListItemButton
                    selected={selectedContact?.id === contact.id}
                    onClick={() => selectContact(contact)}
                    sx={{ px: 2, py: 1.5 }}
                  >
                    <ListItemAvatar>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          sx={{
                            backgroundColor: '#10b981',
                            width: 48,
                            height: 48,
                          }}
                        >
                          {contact.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: getStatusColor(contact.status),
                            border: '2px solid white',
                          }}
                        />
                      </Box>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          {contact.name}
                          {contact.verified && (
                            <Verified color="primary" fontSize="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {contact.lastSeen}
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {contact.addresses?.map((addr, idx) => (
                              <Chip
                                key={idx}
                                label={addr.blockchain}
                                size="small"
                                sx={{
                                  mr: 0.5,
                                  fontSize: '0.65rem',
                                  height: 20,
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>

        {/* Message Panel */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ backgroundColor: '#10b981' }}>
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedContact.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedContact.addresses[0]?.address.slice(0, 8)}...
                      {selectedContact.addresses[0]?.address.slice(-6)} •{' '}
                      {selectedContact.status}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 'auto' }}>
                    <Chip
                      icon={<Lock />}
                      label="Encrypted"
                      color="success"
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {messages.map(msg => (
                  <Box
                    key={msg.id}
                    sx={{
                      mb: 2,
                      display: 'flex',
                      justifyContent:
                        msg.sender === 'me' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        backgroundColor:
                          msg.sender === 'me' ? '#10b981' : 'grey.100',
                        color: msg.sender === 'me' ? 'white' : 'text.primary',
                      }}
                    >
                      <Typography variant="body1">{msg.content}</Typography>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        sx={{ mt: 1 }}
                      >
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </Typography>
                        {msg.encrypted && (
                          <Lock fontSize="small" sx={{ opacity: 0.8 }} />
                        )}
                        {msg.verified && (
                          <Verified fontSize="small" sx={{ opacity: 0.8 }} />
                        )}
                      </Box>
                    </Paper>
                  </Box>
                ))}
              </Box>

              {/* Message Input */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type your secure message..."
                    onKeyPress={e => e.key === 'Enter' && sendMessage()}
                    multiline
                    maxRows={3}
                  />
                  <Button
                    variant="contained"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    sx={{
                      backgroundColor: '#10b981',
                      '&:hover': { backgroundColor: '#059669' },
                      minWidth: 'auto',
                      px: 2,
                    }}
                  >
                    <Send />
                  </Button>
                </Box>

                {/* Quick Actions */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AttachMoney />}
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    Request Payment
                  </Button>
                  <Button variant="outlined" size="small" startIcon={<Timer />}>
                    Disappearing Message
                  </Button>
                </Box>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Person sx={{ fontSize: 64, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                Select a contact to start secure messaging
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Payment Request Dialog */}
      <Dialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
      >
        <DialogTitle>Request Payment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (ETH)"
            type="number"
            fullWidth
            variant="outlined"
            value={paymentAmount}
            onChange={e => setPaymentAmount(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
          <Button onClick={sendPaymentRequest} variant="contained">
            Send Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Chat Dialog */}
      <Dialog
        open={showNewChatDialog}
        onClose={() => setShowNewChatDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Start New Secure Chat</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add a new contact to start an encrypted conversation
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Contact Name"
            fullWidth
            variant="outlined"
            value={newContactName}
            onChange={e => setNewContactName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Wallet Address"
            fullWidth
            variant="outlined"
            value={newContactAddress}
            onChange={e => setNewContactAddress(e.target.value)}
            placeholder="0x..."
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            label="Blockchain"
            fullWidth
            variant="outlined"
            value={newContactBlockchain}
            onChange={e => setNewContactBlockchain(e.target.value)}
            SelectProps={{
              native: true,
            }}
          >
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="optimism">Optimism</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewChatDialog(false)}>Cancel</Button>
          <Button
            onClick={createNewChat}
            variant="contained"
            disabled={!newContactName || !newContactAddress}
            sx={{
              backgroundColor: '#10b981',
              '&:hover': { backgroundColor: '#059669' },
            }}
          >
            Start Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default function SecureMessaging() {
  return <DemoSurfaceGate testId="secure-messaging" title="Secure messaging is unavailable"
    description="No supported messaging protocol is connected. Contacts, encryption and delivery in this preview are illustrative only.">
    <SecureMessagingSample />
  </DemoSurfaceGate>;
}
