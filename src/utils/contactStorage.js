/**
 * Contact Storage Utility
 * Manages secure local storage of contact information
 * Zero centralized data storage - all data remains on device
 */

class ContactStorage {
  constructor() {
    this.storageKey = 'wrfcoin_contacts';
  }

  /**
   * Get all contacts from local storage
   */
  async getAllContacts() {
    try {
      const contactsData = localStorage.getItem(this.storageKey);
      if (!contactsData) return [];

      return JSON.parse(contactsData);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      return [];
    }
  }

  /**
   * Get a specific contact by ID
   */
  async getContact(contactId) {
    try {
      const contacts = await this.getAllContacts();
      return contacts.find(contact => contact.id === contactId);
    } catch (error) {
      console.error('Failed to get contact:', error);
      return null;
    }
  }

  /**
   * Add a new contact
   */
  async addContact(contact) {
    try {
      const contacts = await this.getAllContacts();

      // Validate contact data
      if (!contact.name || !contact.id) {
        throw new Error('Contact must have name and id');
      }

      // Check for duplicate ID
      if (contacts.some(c => c.id === contact.id)) {
        throw new Error('Contact with this ID already exists');
      }

      contacts.push({
        ...contact,
        createdAt: contact.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString(),
      });

      localStorage.setItem(this.storageKey, JSON.stringify(contacts));
      return contact;
    } catch (error) {
      console.error('Failed to add contact:', error);
      throw error;
    }
  }

  /**
   * Update an existing contact
   */
  async updateContact(contactId, updatedContact) {
    try {
      const contacts = await this.getAllContacts();
      const contactIndex = contacts.findIndex(c => c.id === contactId);

      if (contactIndex === -1) {
        throw new Error('Contact not found');
      }

      contacts[contactIndex] = {
        ...contacts[contactIndex],
        ...updatedContact,
        id: contactId, // Ensure ID doesn't change
        lastModified: new Date().toISOString(),
      };

      localStorage.setItem(this.storageKey, JSON.stringify(contacts));
      return contacts[contactIndex];
    } catch (error) {
      console.error('Failed to update contact:', error);
      throw error;
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(contactId) {
    try {
      const contacts = await this.getAllContacts();
      const filteredContacts = contacts.filter(c => c.id !== contactId);

      if (filteredContacts.length === contacts.length) {
        throw new Error('Contact not found');
      }

      localStorage.setItem(this.storageKey, JSON.stringify(filteredContacts));
      return true;
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error;
    }
  }

  /**
   * Search contacts by name or address
   */
  async searchContacts(searchTerm) {
    try {
      const contacts = await this.getAllContacts();
      const lowerSearchTerm = searchTerm.toLowerCase();

      return contacts.filter(
        contact =>
          contact.name.toLowerCase().includes(lowerSearchTerm) ||
          contact.addresses.some(
            addr =>
              addr.address.toLowerCase().includes(lowerSearchTerm) ||
              addr.label.toLowerCase().includes(lowerSearchTerm),
          ) ||
          (contact.notes &&
            contact.notes.toLowerCase().includes(lowerSearchTerm)),
      );
    } catch (error) {
      console.error('Failed to search contacts:', error);
      return [];
    }
  }

  /**
   * Get contacts by blockchain type
   */
  async getContactsByBlockchain(blockchain) {
    try {
      const contacts = await this.getAllContacts();
      return contacts.filter(contact =>
        contact.addresses.some(addr => addr.blockchain === blockchain),
      );
    } catch (error) {
      console.error('Failed to get contacts by blockchain:', error);
      return [];
    }
  }

  /**
   * Get verified contacts only
   */
  async getVerifiedContacts() {
    try {
      const contacts = await this.getAllContacts();
      return contacts.filter(contact => contact.verified);
    } catch (error) {
      console.error('Failed to get verified contacts:', error);
      return [];
    }
  }

  /**
   * Import contacts from JSON
   */
  async importContacts(contactsJson) {
    try {
      const importedContacts = JSON.parse(contactsJson);
      if (!Array.isArray(importedContacts)) {
        throw new Error('Invalid contacts format');
      }

      const existingContacts = await this.getAllContacts();
      const newContacts = [];

      for (const contact of importedContacts) {
        // Validate required fields
        if (!contact.name || !contact.addresses) {
          console.warn('Skipping invalid contact:', contact);
          continue;
        }

        // Generate new ID if doesn't exist or conflicts
        const contactId = contact.id || Date.now() + Math.random().toString(36);
        if (existingContacts.some(c => c.id === contactId)) {
          contact.id = Date.now() + Math.random().toString(36);
        } else {
          contact.id = contactId;
        }

        newContacts.push({
          ...contact,
          createdAt: contact.createdAt || new Date().toISOString(),
          lastModified: new Date().toISOString(),
        });
      }

      const allContacts = [...existingContacts, ...newContacts];
      localStorage.setItem(this.storageKey, JSON.stringify(allContacts));

      return newContacts.length;
    } catch (error) {
      console.error('Failed to import contacts:', error);
      throw error;
    }
  }

  /**
   * Export contacts to JSON
   */
  async exportContacts() {
    try {
      const contacts = await this.getAllContacts();
      return JSON.stringify(contacts, null, 2);
    } catch (error) {
      console.error('Failed to export contacts:', error);
      throw error;
    }
  }

  /**
   * Clear all contacts (for reset/logout)
   */
  async clearAllContacts() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Failed to clear contacts:', error);
      throw error;
    }
  }

  /**
   * Get contact statistics
   */
  async getContactStats() {
    try {
      const contacts = await this.getAllContacts();
      const blockchainCounts = {};

      contacts.forEach(contact => {
        contact.addresses.forEach(addr => {
          blockchainCounts[addr.blockchain] =
            (blockchainCounts[addr.blockchain] || 0) + 1;
        });
      });

      return {
        totalContacts: contacts.length,
        verifiedContacts: contacts.filter(c => c.verified).length,
        blockchainDistribution: blockchainCounts,
        totalAddresses: contacts.reduce(
          (sum, c) => sum + c.addresses.length,
          0,
        ),
      };
    } catch (error) {
      console.error('Failed to get contact stats:', error);
      return {
        totalContacts: 0,
        verifiedContacts: 0,
        blockchainDistribution: {},
        totalAddresses: 0,
      };
    }
  }

  /**
   * Validate contact data structure
   */
  validateContact(contact) {
    const errors = [];

    if (!contact.name || typeof contact.name !== 'string') {
      errors.push('Contact name is required');
    }

    if (
      !contact.addresses ||
      !Array.isArray(contact.addresses) ||
      contact.addresses.length === 0
    ) {
      errors.push('Contact must have at least one address');
    } else {
      contact.addresses.forEach((addr, index) => {
        if (!addr.address || typeof addr.address !== 'string') {
          errors.push(`Address ${index + 1} is invalid`);
        }
        if (!addr.blockchain || typeof addr.blockchain !== 'string') {
          errors.push(`Address ${index + 1} must specify blockchain`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Create singleton instance
export const contactStorage = new ContactStorage();

// Export helper functions for backward compatibility
export const getContacts = () => contactStorage.getAllContacts();
export const getGroupChats = () => Promise.resolve([]); // Group chat functionality to be implemented

export default contactStorage;
