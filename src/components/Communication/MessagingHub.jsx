import React, { useState, useEffect } from 'react';
import contactStorage from '../../utils/contactStorage';
import messageStorage from '../../utils/messageStorage';
import ProtocolInfo from './ProtocolInfo';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Message as MessageIcon,
  Send as SendIcon,
  Search as SearchIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon,
  Splitscreen as SplitscreenIcon,
  Security as SecurityIcon,
  VideoCall as VideoCallIcon,
  Close as CloseIcon,
  Group as GroupIcon,
  GroupAdd as GroupAddIcon,
} from '@mui/icons-material';

const MessagingHub = () => {
  const [contacts, setContacts] = useState([]);

  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [showSecurityNotice, setShowSecurityNotice] = useState(true);
  const [showProtocolInfo, setShowProtocolInfo] = useState(false);
  const [disappearingMessages, setDisappearingMessages] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReason, setPaymentReason] = useState('');
  const [splitAmount, setSplitAmount] = useState('');
  const [splitReason, setSplitReason] = useState('');
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [newContactBlockchain, setNewContactBlockchain] = useState('ethereum');

  // Load contacts from secure address book on component mount
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const addressBookContacts = await contactStorage.loadContacts();
        // Transform address book format to messaging format
        const messagingContacts = addressBookContacts.map(contact => ({
          id: contact.id,
          name: contact.name,
          addresses: contact.walletAddresses || [],
          verified: contact.verified || false,
        }));
        setContacts(messagingContacts);
      } catch (error) {
        console.error('Error loading contacts for messaging:', error);
      }
    };

    loadContacts();
  }, []);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleContactSelect = async contact => {
    setSelectedContact(contact);
    // Automatically select the first address as default
    if (contact.addresses && contact.addresses.length > 0) {
      setSelectedAddress(contact.addresses[0]);
      // Load messages for this contact and address from secure storage
      try {
        const savedMessages = await messageStorage.loadMessages(
          contact.id,
          contact.addresses[0].address,
        );
        setMessages(savedMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    const message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'me',
      timestamp: new Date().toISOString(),
      type: 'text',
      disappearing: disappearingMessages,
    };

    // Handle both individual contacts and group chats
    if (selectedContact.type === 'group') {
      // For group chats
      message.targetGroup = selectedContact.id;
      try {
        await messageStorage.saveMessage(selectedContact.id, 'group', message);
        setMessages(prev => [...prev, message]);
        setNewMessage('');
      } catch (error) {
        console.error('Failed to save group message:', error);
        setMessages(prev => [...prev, message]);
        setNewMessage('');
      }
    } else {
      // For individual contacts
      if (!selectedAddress) return;
      message.targetAddress = selectedAddress.address;
      message.blockchain = selectedAddress.blockchain;
      try {
        await messageStorage.saveMessage(
          selectedContact.id,
          selectedAddress.address,
          message,
        );
        setMessages(prev => [...prev, message]);
        setNewMessage('');
      } catch (error) {
        console.error('Failed to save message:', error);
        setMessages(prev => [...prev, message]);
        setNewMessage('');
      }
    }
  };

  const sendPaymentRequest = async () => {
    if (!selectedContact || !selectedAddress || !paymentAmount) return;

    const message = {
      id: Date.now().toString(),
      content: `💰 Payment Request: $${paymentAmount}${paymentReason ? ` - ${paymentReason}` : ''}`,
      sender: 'me',
      timestamp: new Date().toISOString(),
      type: 'payment_request',
      amount: paymentAmount,
      reason: paymentReason,
      status: 'pending',
    };

    // Save message to secure local storage
    try {
      await messageStorage.saveMessage(
        selectedContact.id,
        selectedAddress.address,
        message,
      );
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('Failed to save payment request:', error);
      setMessages(prev => [...prev, message]);
    }

    // Reset form and close dialog
    setPaymentAmount('');
    setPaymentReason('');
    setShowPaymentDialog(false);
  };

  const sendBillSplit = async () => {
    if (!selectedContact || !selectedAddress || !splitAmount) return;

    const message = {
      id: Date.now().toString(),
      content: `🧾 Split Bill: $${splitAmount}${splitReason ? ` - ${splitReason}` : ''}`,
      sender: 'me',
      timestamp: new Date().toISOString(),
      type: 'split_bill',
      amount: splitAmount,
      reason: splitReason,
      status: 'pending',
    };

    // Save message to secure local storage
    try {
      await messageStorage.saveMessage(
        selectedContact.id,
        selectedAddress.address,
        message,
      );
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('Failed to save split bill:', error);
      setMessages(prev => [...prev, message]);
    }

    // Reset form and close dialog
    setSplitAmount('');
    setSplitReason('');
    setShowSplitDialog(false);
  };

  const handleVideoCall = () => {
    // Video call logic
  };

  const createNewChat = async () => {
    if (!newContactName || !newContactAddress) return;

    const newContact = {
      id: Date.now().toString(),
      name: newContactName,
      addresses: [
        {
          address: newContactAddress,
          blockchain: newContactBlockchain,
          label: 'Primary',
        },
      ],
      verified: false,
      created: new Date().toISOString(),
    };

    // Save contact to persistent storage
    try {
      const currentContacts = await contactStorage.loadContacts();
      const updatedContacts = [...currentContacts, newContact];
      await contactStorage.saveContacts(updatedContacts);

      // Update contacts state and select the new contact
      setContacts(prev => [...prev, newContact]);
      setSelectedContact(newContact);
      setSelectedAddress(newContact.addresses[0]);
      setMessages([]);
    } catch (error) {
      console.error('Failed to save new contact:', error);
    }

    // Reset form and close dialog
    setNewContactName('');
    setNewContactAddress('');
    setNewContactBlockchain('ethereum');
    setShowNewChatDialog(false);
  };

  const createGroup = async () => {
    if (!groupName || selectedGroupMembers.length === 0) return;

    const newGroup = {
      id: Date.now().toString(),
      name: groupName,
      members: selectedGroupMembers,
      type: 'group',
      created: new Date().toISOString(),
      lastMessage: 'Group created',
      memberCount: selectedGroupMembers.length,
    };

    // Save group to persistent storage
    try {
      const currentContacts = await contactStorage.loadContacts();
      const updatedContacts = [...currentContacts, newGroup];
      await contactStorage.saveContacts(updatedContacts);

      // Update both groups and contacts state
      setGroups(prev => [...prev, newGroup]);
      setContacts(prev => [...prev, newGroup]);
    } catch (error) {
      console.error('Failed to save group:', error);
    }

    setGroupName('');
    setSelectedGroupMembers([]);
    setShowGroupDialog(false);
  };

  const handleGroupSelect = async group => {
    setSelectedContact(group);
    setSelectedAddress(null); // Groups don't use addresses
    try {
      const savedMessages = await messageStorage.loadMessages(
        group.id,
        'group',
      );
      setMessages(savedMessages);
    } catch (error) {
      console.error('Failed to load group messages:', error);
      setMessages([]);
    }
  };

  // Handle address selection change to load messages for that specific address
  const handleAddressChange = async newAddress => {
    setSelectedAddress(newAddress);
    if (selectedContact && newAddress) {
      try {
        const savedMessages = await messageStorage.loadMessages(
          selectedContact.id,
          newAddress.address,
        );
        setMessages(savedMessages);
      } catch (error) {
        console.error('Failed to load messages for address:', error);
        setMessages([]);
      }
    }
  };

  return (
    <>
      <Box
        sx={{
          height: 'calc(100vh - 60px)', // Account for taskbar
          width: '100vw',
          maxWidth: 'none',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          color: 'text.primary',
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      >
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderRadius: 0,
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#6c5ce7' }}>
                <MessageIcon />
              </Avatar>
              <Typography variant="h6">Secure Messaging Hub</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Create Group Chat">
                <IconButton
                  onClick={() => setShowGroupDialog(true)}
                  sx={{ color: '#2196f3' }}
                >
                  <GroupAddIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Request Payment">
                <IconButton
                  onClick={() => setShowPaymentDialog(true)}
                  sx={{ color: '#4caf50' }}
                >
                  <AttachMoneyIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Split Bill">
                <IconButton
                  onClick={() => setShowSplitDialog(true)}
                  sx={{ color: '#ff9800' }}
                >
                  <SplitscreenIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Protocol Info">
                <IconButton
                  onClick={() => setShowProtocolInfo(true)}
                  sx={{ color: '#2196f3' }}
                >
                  <SecurityIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {/* Contact List */}
          <Paper
            elevation={2}
            sx={{
              width: 300,
              bgcolor: 'background.paper',
              borderRadius: 0,
              borderRight: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom color="text.primary">
                Secure Contacts
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  ),
                  sx: { bgcolor: 'action.hover' },
                }}
              />
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {/* Group Chats Section */}
              {filteredContacts.some(c => c.type === 'group') && (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      p: 2,
                      pb: 1,
                      color: 'text.secondary',
                      fontWeight: 'bold',
                    }}
                  >
                    Group Chats
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {filteredContacts
                      .filter(contact => contact.type === 'group')
                      .map(group => (
                        <ListItem
                          key={group.id}
                          component="div"
                          selected={selectedContact?.id === group.id}
                          onClick={() => handleGroupSelect(group)}
                          sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            cursor: 'pointer',
                            bgcolor: 'rgba(33, 150, 243, 0.05)',
                            '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.1)' },
                            '&.Mui-selected': {
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: '#2196f3' }}>
                              <GroupIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={group.name}
                            secondary={
                              <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                              >
                                {group.memberCount} members •{' '}
                                {group.lastMessage}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                  </List>
                </>
              )}

              {/* Individual Contacts Section */}
              <Typography
                variant="subtitle2"
                sx={{
                  p: 2,
                  pb: 1,
                  color: 'text.secondary',
                  fontWeight: 'bold',
                }}
              >
                Contacts
              </Typography>
              <List sx={{ p: 0 }}>
                {filteredContacts
                  .filter(contact => contact.type !== 'group')
                  .map(contact => (
                    <ListItem
                      key={contact.id}
                      component="div"
                      selected={selectedContact?.id === contact.id}
                      onClick={() => handleContactSelect(contact)}
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: contact.verified ? '#4caf50' : '#666',
                          }}
                        >
                          {contact.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={contact.name}
                        secondary={
                          <span>
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                            >
                              {contact.addresses[0]?.address.substring(0, 12)}
                              ...
                            </Typography>
                            {contact.verified && (
                              <Chip
                                size="small"
                                label="Verified"
                                color="success"
                                sx={{ ml: 1, height: 16 }}
                              />
                            )}
                          </span>
                        }
                      />
                    </ListItem>
                  ))}
              </List>
            </Box>
          </Paper>

          {/* Chat Area */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.default',
            }}
          >
            {selectedContact && selectedContact.name ? (
              <>
                {/* Chat Header */}
                <Paper
                  elevation={1}
                  sx={{
                    bgcolor: 'background.paper',
                    p: 2,
                    borderRadius: 0,
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor:
                            selectedContact.type === 'group'
                              ? '#2196f3'
                              : selectedContact.verified
                                ? 'success.main'
                                : 'grey.500',
                        }}
                      >
                        {selectedContact.type === 'group' ? (
                          <GroupIcon />
                        ) : (
                          selectedContact.name.charAt(0).toUpperCase()
                        )}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" color="text.primary">
                          {selectedContact.name}
                        </Typography>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          {selectedContact.type === 'group' ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {selectedContact.memberCount || 0} members
                            </Typography>
                          ) : selectedContact.addresses &&
                            selectedContact.addresses.length > 1 ? (
                              <Select
                                value={selectedAddress?.address || ''}
                                onChange={e => {
                                  const addr = selectedContact.addresses.find(
                                    a => a.address === e.target.value,
                                  );
                                  handleAddressChange(addr);
                                }}
                                size="small"
                                sx={{
                                  minWidth: 200,
                                  fontSize: '0.75rem',
                                  '& .MuiSelect-select': { py: 0.5 },
                                }}
                              >
                                {(selectedContact.addresses || []).map(
                                  (addr, index) => (
                                    <MenuItem key={index} value={addr.address}>
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                        }}
                                      >
                                        <Typography variant="caption">
                                          {addr.blockchain || 'Unknown'}:{' '}
                                          {addr.address.substring(0, 12)}...
                                        </Typography>
                                        {addr.label && (
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            {addr.label}
                                          </Typography>
                                        )}
                                      </Box>
                                    </MenuItem>
                                  ),
                                )}
                              </Select>
                            ) : (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {selectedAddress?.blockchain}:{' '}
                                {selectedAddress?.address.substring(0, 12)}...
                              </Typography>
                            )}
                          {selectedContact.verified && (
                            <Chip
                              size="small"
                              label="Encrypted"
                              color="success"
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip
                        title={
                          disappearingMessages
                            ? 'Disappearing messages ON'
                            : 'Disappearing messages OFF'
                        }
                      >
                        <IconButton
                          onClick={() =>
                            setDisappearingMessages(!disappearingMessages)
                          }
                          sx={{
                            color: disappearingMessages
                              ? 'success.main'
                              : 'text.secondary',
                          }}
                        >
                          <ScheduleIcon />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        onClick={handleVideoCall}
                        sx={{ color: 'primary.main' }}
                      >
                        <VideoCallIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>

                {/* Messages */}
                <Box
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 2,
                    bgcolor: 'background.default',
                  }}
                >
                  {messages.map(message => (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent:
                          message.sender === 'me' ? 'flex-end' : 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Paper
                        elevation={2}
                        sx={{
                          maxWidth: '70%',
                          p: 2,
                          backgroundColor:
                            message.type === 'payment_request'
                              ? 'success.light'
                              : message.type === 'split_bill'
                                ? 'warning.light'
                                : message.sender === 'me'
                                  ? 'primary.main'
                                  : 'background.paper',
                          color:
                            message.type === 'payment_request' ||
                            message.type === 'split_bill'
                              ? 'text.primary'
                              : message.sender === 'me'
                                ? 'primary.contrastText'
                                : 'text.primary',
                          borderRadius:
                            message.sender === 'me'
                              ? '18px 18px 5px 18px'
                              : '18px 18px 18px 5px',
                          border:
                            message.sender !== 'me' ||
                            message.type === 'payment_request' ||
                            message.type === 'split_bill'
                              ? 1
                              : 0,
                          borderColor:
                            message.type === 'payment_request'
                              ? 'success.main'
                              : message.type === 'split_bill'
                                ? 'warning.main'
                                : message.sender !== 'me'
                                  ? 'divider'
                                  : 'transparent',
                        }}
                      >
                        {message.type === 'payment_request' ||
                        message.type === 'split_bill' ? (
                            <Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  sx={{ fontWeight: 'bold' }}
                                >
                                  {message.type === 'payment_request'
                                    ? '💰'
                                    : '🧾'}{' '}
                                ${message.amount}
                                </Typography>
                                <Chip
                                  label={message.status}
                                  size="small"
                                  color={
                                    message.status === 'pending'
                                      ? 'warning'
                                      : 'success'
                                  }
                                />
                              </Box>
                              {message.reason && (
                                <Typography
                                  variant="body2"
                                  sx={{ mb: 1, fontStyle: 'italic' }}
                                >
                                  {message.reason}
                                </Typography>
                              )}
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 'bold' }}
                              >
                                {message.type === 'payment_request'
                                  ? 'Payment Request Sent'
                                  : 'Bill Split Request Sent'}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body1">
                              {message.content}
                            </Typography>
                          )}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mt: 1,
                          }}
                        >
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </Typography>
                          {message.securityLevel === 'blockchain-enhanced' && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <SecurityIcon
                                sx={{
                                  fontSize: 12,
                                  color: message.isVerified
                                    ? 'success.main'
                                    : 'warning.main',
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.65rem',
                                  color: message.isVerified
                                    ? 'success.main'
                                    : 'warning.main',
                                }}
                              >
                                {message.isVerified
                                  ? 'Blockchain Verified'
                                  : 'Verification Pending'}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    </Box>
                  ))}
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
                <MessageIcon sx={{ fontSize: 64, color: '#666' }} />
                <Typography variant="h6" color="text.secondary">
                  Select a contact to start messaging
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  Your messages are end-to-end encrypted and stored locally only
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Message Input - Always Visible */}
        <Paper
          elevation={3}
          sx={{
            bgcolor: 'background.paper',
            color: 'text.primary',
            p: 2,
            position: 'fixed',
            bottom: 60,
            left: 250, // Align with right edge of contacts column
            right: 0,
            zIndex: 1000,
            borderRadius: 0,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder={
                selectedContact
                  ? 'Type your message...'
                  : 'Select a contact to start messaging'
              }
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              disabled={!selectedContact}
              onKeyPress={e => {
                if (e.key === 'Enter' && !e.shiftKey && selectedContact) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              InputProps={{
                sx: {
                  bgcolor: 'action.hover',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'divider',
                  },
                },
              }}
            />
            <IconButton
              onClick={sendMessage}
              disabled={!newMessage.trim() || !selectedContact}
              sx={{
                color:
                  newMessage.trim() && selectedContact
                    ? 'primary.main'
                    : 'text.disabled',
                bgcolor:
                  newMessage.trim() && selectedContact
                    ? 'action.hover'
                    : 'transparent',
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>

        {/* Security Notice */}
        {showSecurityNotice && (
          <Paper
            elevation={3}
            sx={{
              position: 'fixed',
              bottom: 180,
              right: 20,
              p: 2,
              bgcolor: 'background.paper',
              color: 'text.primary',
              border: '1px solid',
              borderColor: 'success.main',
              maxWidth: 300,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <SecurityIcon color="success" />
              <Typography variant="subtitle2" color="success">
                Security Notice
              </Typography>
              <IconButton
                size="small"
                onClick={() => setShowSecurityNotice(false)}
                sx={{ ml: 'auto', color: 'text.secondary' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Messages are secured with blockchain-enhanced encryption and
              cryptographic verification. Your conversations are protected by
              the same security that powers cryptocurrency.
            </Typography>
          </Paper>
        )}
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
            label="Amount"
            type="number"
            fullWidth
            variant="outlined"
            value={paymentAmount}
            onChange={e => setPaymentAmount(e.target.value)}
            placeholder="0.00"
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={paymentReason}
            onChange={e => setPaymentReason(e.target.value)}
            placeholder="What's this payment for?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
          <Button onClick={sendPaymentRequest} variant="contained">
            Send Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bill Split Dialog */}
      <Dialog open={showSplitDialog} onClose={() => setShowSplitDialog(false)}>
        <DialogTitle>Split Bill</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Total Amount"
            type="number"
            fullWidth
            variant="outlined"
            value={splitAmount}
            onChange={e => setSplitAmount(e.target.value)}
            placeholder="0.00"
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={splitReason}
            onChange={e => setSplitReason(e.target.value)}
            placeholder="What are you splitting?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSplitDialog(false)}>Cancel</Button>
          <Button onClick={sendBillSplit} variant="contained">
            Send Split Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Chat Creation Dialog */}
      <Dialog
        open={showGroupDialog}
        onClose={() => setShowGroupDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Group Chat</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Group Name"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Select Members:
          </Typography>

          <List
            sx={{
              maxHeight: 200,
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            {contacts.map(contact => (
              <ListItem
                key={contact.id}
                button
                onClick={() => {
                  const isSelected = selectedGroupMembers.find(
                    m => m.id === contact.id,
                  );
                  if (isSelected) {
                    setSelectedGroupMembers(prev =>
                      prev.filter(m => m.id !== contact.id),
                    );
                  } else {
                    setSelectedGroupMembers(prev => [...prev, contact]);
                  }
                }}
                sx={{
                  bgcolor: selectedGroupMembers.find(m => m.id === contact.id)
                    ? 'primary.main'
                    : 'transparent',
                  color: selectedGroupMembers.find(m => m.id === contact.id)
                    ? 'primary.contrastText'
                    : 'text.primary',
                  '&:hover': {
                    bgcolor: selectedGroupMembers.find(m => m.id === contact.id)
                      ? 'primary.dark'
                      : 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{ bgcolor: contact.verified ? '#4caf50' : '#666' }}
                  >
                    {contact.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={contact.name}
                  secondary={
                    contact.addresses[0]?.address.substring(0, 12) + '...'
                  }
                />
              </ListItem>
            ))}
          </List>

          {selectedGroupMembers.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Selected: {selectedGroupMembers.map(m => m.name).join(', ')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGroupDialog(false)}>Cancel</Button>
          <Button
            onClick={createGroup}
            variant="contained"
            disabled={!groupName || selectedGroupMembers.length === 0}
          >
            Create Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* Protocol Info Dialog */}
      <ProtocolInfo
        open={showProtocolInfo}
        onClose={() => setShowProtocolInfo(false)}
      />
    </>
  );
};

export default MessagingHub;
