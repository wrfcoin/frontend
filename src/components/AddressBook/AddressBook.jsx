import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
} from '@mui/material';
import {
  Add,
  Search,
  Person,
  Edit,
  Delete,
  Close,
  Email,
  Phone,
  Language,
  QrCode,
  ContentCopy,
} from '@mui/icons-material';

const AddressBook = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    socialMedia: '',
    addresses: [{ address: '', blockchain: '', label: '' }],
  });

  // Sample contacts with comprehensive information
  useEffect(() => {
    const sampleContacts = [
      {
        id: 1,
        name: 'Tony Stark',
        email: 'tony@starkindustries.com',
        phone: '+1 (555) 123-4567',
        socialMedia: 'https://twitter.com/tonystark',
        dateAdded: '5/26/2025',
        addresses: [
          {
            address: '0x6858d4d7c8bF5aC2D8F5acc',
            blockchain: 'Ethereum',
            label: 'Primary',
          },
          {
            address: 'J3c1Jr8L9mN2To4P6Q8s',
            blockchain: 'Solana',
            label: 'Savings',
          },
          {
            address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            blockchain: 'Bitcoin',
            label: 'Cold Storage',
          },
        ],
      },
      {
        id: 2,
        name: 'Alice Johnson',
        email: 'alice@blockchain.dev',
        phone: '+1 (555) 987-6543',
        socialMedia: 'https://github.com/alicecrypto',
        dateAdded: '5/20/2025',
        addresses: [
          {
            address: '0x1234567890abcdef1234567890abcdef12345678',
            blockchain: 'Ethereum',
            label: 'Main',
          },
          {
            address: 'cosmos1abc123def456ghi789jkl012mno345pqr678stu',
            blockchain: 'Cosmos',
            label: 'Staking',
          },
        ],
      },
    ];
    setContacts(sampleContacts);
    setSelectedContact(sampleContacts[0]); // Select first contact by default
  }, []);

  const blockchainOptions = [
    'Ethereum',
    'Bitcoin',
    'Polygon',
    'Binance Smart Chain',
    'Solana',
    'Cardano',
    'Cosmos',
    'Avalanche',
    'Fantom',
    'Arbitrum',
  ];

  const filteredContacts = contacts.filter(
    contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddContact = () => {
    if (newContact.name.trim() && newContact.addresses[0].address.trim()) {
      const contact = {
        id: Date.now(),
        name: newContact.name,
        email: newContact.email,
        phone: newContact.phone,
        socialMedia: newContact.socialMedia,
        dateAdded: new Date().toLocaleDateString(),
        addresses: newContact.addresses.filter(addr => addr.address.trim()),
      };
      setContacts([...contacts, contact]);
      setNewContact({
        name: '',
        email: '',
        phone: '',
        socialMedia: '',
        addresses: [{ address: '', blockchain: '', label: '' }],
      });
      setIsAddContactOpen(false);
      setSelectedContact(contact);
    }
  };

  const handleEditContact = contact => {
    setEditingContact(contact);
    setNewContact({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      socialMedia: contact.socialMedia || '',
      addresses: [...contact.addresses],
    });
    setIsEditContactOpen(true);
  };

  const handleUpdateContact = () => {
    if (
      newContact.name.trim() &&
      newContact.addresses.some(addr => addr.address.trim())
    ) {
      const updatedContacts = contacts.map(contact =>
        contact.id === editingContact.id
          ? {
            ...contact,
            name: newContact.name,
            email: newContact.email,
            phone: newContact.phone,
            socialMedia: newContact.socialMedia,
            addresses: newContact.addresses.filter(addr =>
              addr.address.trim(),
            ),
          }
          : contact,
      );
      setContacts(updatedContacts);
      setSelectedContact(updatedContacts.find(c => c.id === editingContact.id));
      setIsEditContactOpen(false);
      setEditingContact(null);
      setNewContact({
        name: '',
        email: '',
        phone: '',
        socialMedia: '',
        addresses: [{ address: '', blockchain: '', label: '' }],
      });
    }
  };

  const handleDeleteContact = contactId => {
    const updatedContacts = contacts.filter(
      contact => contact.id !== contactId,
    );
    setContacts(updatedContacts);
    if (selectedContact?.id === contactId) {
      setSelectedContact(updatedContacts[0] || null);
    }
  };

  const addAddressField = () => {
    setNewContact({
      ...newContact,
      addresses: [
        ...newContact.addresses,
        { address: '', blockchain: '', label: '' },
      ],
    });
  };

  const removeAddressField = index => {
    if (newContact.addresses.length > 1) {
      const updatedAddresses = newContact.addresses.filter(
        (_, i) => i !== index,
      );
      setNewContact({ ...newContact, addresses: updatedAddresses });
    }
  };

  const updateAddress = (index, field, value) => {
    const updatedAddresses = newContact.addresses.map((addr, i) =>
      i === index ? { ...addr, [field]: value } : addr,
    );
    setNewContact({ ...newContact, addresses: updatedAddresses });
  };

  const copyToClipboard = text => {
    navigator.clipboard.writeText(text);
  };

  const ContactDialog = ({ open, onClose, onSave, title }) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {title}
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Name"
                value={newContact.name}
                onChange={e =>
                  setNewContact({ ...newContact, name: e.target.value })
                }
                fullWidth
                variant="outlined"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email Address"
                value={newContact.email}
                onChange={e =>
                  setNewContact({ ...newContact, email: e.target.value })
                }
                fullWidth
                variant="outlined"
                type="email"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                value={newContact.phone}
                onChange={e =>
                  setNewContact({ ...newContact, phone: e.target.value })
                }
                fullWidth
                variant="outlined"
                type="tel"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Social Media Link"
                value={newContact.socialMedia}
                onChange={e =>
                  setNewContact({ ...newContact, socialMedia: e.target.value })
                }
                fullWidth
                variant="outlined"
                type="url"
                placeholder="https://twitter.com/username"
              />
            </Grid>
          </Grid>

          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="h6">Wallet Addresses</Typography>
              <Button
                size="small"
                onClick={addAddressField}
                startIcon={<Add />}
              >
                Add Address
              </Button>
            </Box>

            {newContact.addresses.map((address, index) => (
              <Card key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle2">
                      Address {index + 1}
                    </Typography>
                    {newContact.addresses.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => removeAddressField(index)}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>

                  <TextField
                    label="Wallet Address"
                    value={address.address}
                    onChange={e =>
                      updateAddress(index, 'address', e.target.value)
                    }
                    fullWidth
                    variant="outlined"
                    placeholder="0x... or bc1... or other wallet address"
                  />

                  <Box display="flex" gap={2}>
                    <FormControl fullWidth>
                      <InputLabel>Blockchain</InputLabel>
                      <Select
                        value={address.blockchain}
                        onChange={e =>
                          updateAddress(index, 'blockchain', e.target.value)
                        }
                        label="Blockchain"
                      >
                        {blockchainOptions.map(blockchain => (
                          <MenuItem key={blockchain} value={blockchain}>
                            {blockchain}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label="Label (Optional)"
                      value={address.label}
                      onChange={e =>
                        updateAddress(index, 'label', e.target.value)
                      }
                      variant="outlined"
                      placeholder="e.g., Primary, Trading, Savings"
                      fullWidth
                    />
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} variant="contained">
          {title.includes('Add') ? 'Add Contact' : 'Update Contact'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight="bold">
            Address Book
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsAddContactOpen(true)}
            sx={{
              backgroundColor: '#10b981',
              '&:hover': { backgroundColor: '#059669' },
              textTransform: 'uppercase',
              fontWeight: 'bold',
            }}
          >
            ADD CONTACT
          </Button>
        </Box>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
          Secure, encrypted contact management for blockchain communications
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel - Contact List */}
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
              placeholder="Search contacts... (Ctrl+K)"
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
              {filteredContacts.map((contact, index) => (
                <React.Fragment key={contact.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={selectedContact?.id === contact.id}
                      onClick={() => setSelectedContact(contact)}
                      sx={{ px: 2, py: 1.5 }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            backgroundColor: '#10b981',
                            width: 40,
                            height: 40,
                          }}
                        >
                          {contact.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={contact.name}
                        secondary={`${contact.addresses.length} wallet${contact.addresses.length > 1 ? 's' : ''}`}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < filteredContacts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            {filteredContacts.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  {searchTerm ? 'No contacts found' : 'No contacts added yet'}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Last updated: May 26, 2025
            </Typography>
          </Box>
        </Box>

        {/* Right Panel - Contact Details */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {selectedContact ? (
            <Box sx={{ p: 3 }}>
              {/* Contact Header */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                mb={3}
              >
                <Box display="flex" alignItems="center" gap={3}>
                  <Avatar
                    sx={{
                      backgroundColor: '#10b981',
                      width: 80,
                      height: 80,
                      fontSize: '2rem',
                    }}
                  >
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                      {selectedContact.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Added {selectedContact.dateAdded}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={1}>
                  <IconButton
                    onClick={() => handleEditContact(selectedContact)}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteContact(selectedContact.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>

              {/* Contact Information */}
              <Grid container spacing={3}>
                {/* Contact Details */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Contact Information
                    </Typography>

                    {selectedContact.email && (
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Email color="primary" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body1">
                            {selectedContact.email}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(selectedContact.email)}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Box>
                    )}

                    {selectedContact.phone && (
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Phone color="primary" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Phone
                          </Typography>
                          <Typography variant="body1">
                            {selectedContact.phone}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(selectedContact.phone)}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Box>
                    )}

                    {selectedContact.socialMedia && (
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Language color="primary" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Social Media
                          </Typography>
                          <Typography
                            variant="body1"
                            component="a"
                            href={selectedContact.socialMedia}
                            target="_blank"
                            sx={{
                              textDecoration: 'none',
                              color: 'primary.main',
                            }}
                          >
                            {selectedContact.socialMedia}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() =>
                            copyToClipboard(selectedContact.socialMedia)
                          }
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {/* Wallet Addresses */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Wallet Addresses ({selectedContact.addresses.length})
                    </Typography>

                    {selectedContact.addresses.map((addr, index) => (
                      <Box
                        key={index}
                        sx={{
                          mb: 3,
                          p: 2,
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Chip
                            label={addr.blockchain}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {addr.label && (
                            <Chip
                              label={addr.label}
                              size="small"
                              color="success"
                            />
                          )}
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="body2"
                            fontFamily="monospace"
                            sx={{ wordBreak: 'break-all', flex: 1 }}
                          >
                            {addr.address}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(addr.address)}
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                          <IconButton size="small">
                            <QrCode fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Person sx={{ fontSize: 64, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                Select a contact to view details
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Add Contact Dialog */}
      <ContactDialog
        open={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        onSave={handleAddContact}
        title="Add New Contact"
      />

      {/* Edit Contact Dialog */}
      <ContactDialog
        open={isEditContactOpen}
        onClose={() => setIsEditContactOpen(false)}
        onSave={handleUpdateContact}
        title="Edit Contact"
      />
    </Box>
  );
};

export default AddressBook;
