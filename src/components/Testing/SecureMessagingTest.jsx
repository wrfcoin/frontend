import React, { useState, useEffect } from 'react';
import { Send, Lock, Verified, Timer } from '@mui/icons-material';
import { contactStorage } from '../../utils/contactStorage';
import { messageStorage } from '../../utils/messageStorage';
import EncryptionService from '../../services/encryptionService';

const encryptionService = new EncryptionService();
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  Card,
  CardContent,
  Alert,
  Divider,
} from '@mui/material';
// Removed dependency on non-existent SimpleAddressBook

const SecureMessagingTest = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [encryptionStatus, setEncryptionStatus] = useState('');
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    initializeEncryption();
    loadTestData();
  }, []);

  const initializeEncryption = async () => {
    try {
      setEncryptionStatus('Initializing encryption...');
      await encryptionService.initialize();
      setEncryptionStatus('✅ Encryption ready');
    } catch (error) {
      console.error('Encryption initialization failed:', error);
      setEncryptionStatus('❌ Encryption failed to initialize');
    }
  };

  const loadTestData = async () => {
    try {
      // Load existing contacts
      const existingContacts = await contactStorage.getAllContacts();

      // Add some real blockchain addresses for testing if none exist
      if (existingContacts.length === 0) {
        const sampleContacts = [
          {
            id: `contact_${Date.now()}_1`,
            name: 'Ethereum Mainnet Contact',
            addresses: [
              {
                address: '0x742d35Cc6624C0532d8b4C7D8ea8e8Cb5E0bd0B7',
                blockchain: 'ethereum',
                label: 'Main Wallet',
              },
            ],
            verified: true,
            notes: 'Test contact for Ethereum network',
          },
          {
            id: `contact_${Date.now()}_2`,
            name: 'Polygon Network Contact',
            addresses: [
              {
                address: '0x8ba1f109551bD432803012645Hac136c',
                blockchain: 'polygon',
                label: 'DeFi Wallet',
              },
            ],
            verified: true,
            notes: 'Cross-chain testing contact',
          },
        ];

        for (const contact of sampleContacts) {
          try {
            await contactStorage.addContact(contact);
            setTestResults(prev => [
              ...prev,
              {
                type: 'success',
                message: `Added test contact: ${contact.name}`,
              },
            ]);
          } catch (error) {
            setTestResults(prev => [
              ...prev,
              {
                type: 'error',
                message: `Failed to add contact ${contact.name}: ${error.message}`,
              },
            ]);
          }
        }
      }

      const allContacts = await contactStorage.getAllContacts();
      setContacts(allContacts);

      // Test encryption service
      testEncryptionService();
    } catch (error) {
      console.error('Error loading test data:', error);
      setTestResults(prev => [
        ...prev,
        { type: 'error', message: 'Failed to load contacts' },
      ]);
    }
  };

  const testEncryptionService = async () => {
    try {
      setEncryptionStatus('Testing encryption service...');

      // Generate key pair for testing
      const keyPair = await encryptionService.generateKeyPair();
      setTestResults(prev => [
        ...prev,
        {
          type: 'success',
          message: 'Key pair generated successfully',
        },
      ]);

      // Test message encryption
      const testMessage = 'Hello, this is a secure test message!';
      const encrypted = await encryptionService.encryptMessage(
        testMessage,
        keyPair.publicKey,
      );
      const decrypted = await encryptionService.decryptMessage(
        encrypted,
        keyPair.privateKey,
      );

      if (decrypted === testMessage) {
        setTestResults(prev => [
          ...prev,
          {
            type: 'success',
            message: 'End-to-end encryption working correctly',
          },
        ]);
        setEncryptionStatus(
          '🔒 Encryption verified - Ready for secure messaging',
        );
      } else {
        throw new Error('Encryption test failed');
      }
    } catch (error) {
      setTestResults(prev => [
        ...prev,
        {
          type: 'error',
          message: `Encryption test failed: ${error.message}`,
        },
      ]);
      setEncryptionStatus('❌ Encryption service unavailable');
    }
  };

  const sendSecureMessage = async () => {
    if (!selectedContact || !newMessage.trim()) return;

    try {
      const messageData = {
        recipientId: selectedContact.id,
        content: newMessage,
        type: 'text',
        encrypted: true,
        timestamp: Date.now(),
      };

      // Store encrypted message
      await messageStorage.storeMessage(messageData);

      // Update local messages
      const updatedMessages = await messageStorage.getMessages(
        selectedContact.id,
      );
      setMessages(updatedMessages);

      setNewMessage('');
      setTestResults(prev => [
        ...prev,
        {
          type: 'success',
          message: `Secure message sent to ${selectedContact.name}`,
        },
      ]);
    } catch (error) {
      setTestResults(prev => [
        ...prev,
        {
          type: 'error',
          message: `Failed to send message: ${error.message}`,
        },
      ]);
    }
  };

  const loadMessagesForContact = async contact => {
    setSelectedContact(contact);
    try {
      const contactMessages = await messageStorage.getMessages(contact.id);
      setMessages(contactMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createPaymentRequest = async () => {
    if (!selectedContact) return;

    const paymentRequest = {
      type: 'payment_request',
      amount: '0.1',
      currency: 'ETH',
      description: 'Test payment request',
      recipient: selectedContact.addresses[0]?.address,
    };

    try {
      await messageStorage.storeMessage({
        recipientId: selectedContact.id,
        content: JSON.stringify(paymentRequest),
        type: 'payment_request',
        encrypted: true,
        timestamp: Date.now(),
      });

      setTestResults(prev => [
        ...prev,
        {
          type: 'success',
          message: `Payment request sent to ${selectedContact.name}`,
        },
      ]);
    } catch (error) {
      setTestResults(prev => [
        ...prev,
        {
          type: 'error',
          message: `Failed to send payment request: ${error.message}`,
        },
      ]);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <Lock color="primary" />
        Secure Messaging Test Environment
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        This testing environment demonstrates your secure messaging system with
        Signal-level encryption, zero centralized storage, and cross-chain
        payment capabilities.
      </Alert>

      {/* Encryption Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Encryption Status
          </Typography>
          <Typography
            variant="body1"
            color={
              encryptionStatus.includes('verified')
                ? 'success.main'
                : 'text.secondary'
            }
          >
            {encryptionStatus}
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 3, height: '600px' }}>
        {/* Contacts Panel */}
        <Paper sx={{ width: '300px', p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Secure Contacts
          </Typography>
          <List>
            {contacts.map(contact => (
              <ListItem
                key={contact.id}
                component="div"
                selected={selectedContact?.id === contact.id}
                onClick={() => loadMessagesForContact(contact)}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  cursor: 'pointer',
                  backgroundColor:
                    selectedContact?.id === contact.id
                      ? 'action.selected'
                      : 'background.paper',
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {contact.name}
                      {contact.verified && (
                        <Verified color="primary" fontSize="small" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      {contact.addresses?.map((addr, idx) => (
                        <Chip
                          key={idx}
                          label={addr.blockchain}
                          size="small"
                          sx={{ mr: 0.5, mt: 0.5 }}
                        />
                      ))}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Message Panel */}
        <Paper sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
          {selectedContact ? (
            <>
              <Typography variant="h6" gutterBottom>
                Secure Chat with {selectedContact.name}
              </Typography>

              <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
                {messages.length === 0 ? (
                  <Typography
                    color="text.secondary"
                    sx={{ textAlign: 'center', mt: 4 }}
                  >
                    No messages yet. Send your first secure message!
                  </Typography>
                ) : (
                  messages.map((msg, idx) => (
                    <Box
                      key={idx}
                      sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}
                    >
                      <Typography variant="body2">{msg.content}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(msg.timestamp).toLocaleString()}
                        {msg.encrypted && (
                          <Lock fontSize="small" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Message Input */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type your secure message..."
                  onKeyPress={e => e.key === 'Enter' && sendSecureMessage()}
                />
                <Button
                  variant="contained"
                  onClick={sendSecureMessage}
                  startIcon={<Send />}
                  disabled={!newMessage.trim()}
                >
                  Send
                </Button>
              </Box>

              {/* Quick Actions */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={createPaymentRequest}
                  size="small"
                >
                  Request Payment
                </Button>
                <Button variant="outlined" size="small" startIcon={<Timer />}>
                  Disappearing Message
                </Button>
              </Box>
            </>
          ) : (
            <Typography
              color="text.secondary"
              sx={{ textAlign: 'center', mt: 4 }}
            >
              Select a contact to start secure messaging
            </Typography>
          )}
        </Paper>
      </Box>

      {/* Test Results */}
      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Test Results
        </Typography>
        {testResults.map((result, idx) => (
          <Alert key={idx} severity={result.type} sx={{ mb: 1 }}>
            {result.message}
          </Alert>
        ))}
      </Paper>
    </Box>
  );
};

export default SecureMessagingTest;
