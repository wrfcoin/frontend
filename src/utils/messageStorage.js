/**
 * Message Storage Utility
 * Manages secure local storage of encrypted messages
 * Zero centralized data storage - all messages remain on device
 */

class MessageStorage {
  constructor() {
    this.storageKey = 'wrfcoin_messages';
  }

  /**
   * Get all messages from local storage
   */
  async getAllMessages() {
    try {
      const messagesData = localStorage.getItem(this.storageKey);
      if (!messagesData) return [];

      return JSON.parse(messagesData);
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  }

  /**
   * Get messages for a specific contact
   */
  async getMessages(contactId) {
    try {
      const allMessages = await this.getAllMessages();
      return allMessages
        .filter(message => message.contactId === contactId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
      console.error('Failed to get messages for contact:', error);
      return [];
    }
  }

  /**
   * Add a new message
   */
  async addMessage(message) {
    try {
      const messages = await this.getAllMessages();

      const messageData = {
        ...message,
        id: message.id || Date.now().toString(),
        timestamp: message.timestamp || new Date().toISOString(),
      };

      messages.push(messageData);
      localStorage.setItem(this.storageKey, JSON.stringify(messages));

      return messageData;
    } catch (error) {
      console.error('Failed to add message:', error);
      throw error;
    }
  }

  /**
   * Store a message (alias for addMessage)
   */
  async storeMessage(message) {
    return await this.addMessage(message);
  }

  /**
   * Delete a specific message
   */
  async deleteMessage(messageId) {
    try {
      const messages = await this.getAllMessages();
      const filteredMessages = messages.filter(m => m.id !== messageId);

      localStorage.setItem(this.storageKey, JSON.stringify(filteredMessages));
      return true;
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  /**
   * Delete all messages for a contact
   */
  async deleteMessagesForContact(contactId) {
    try {
      const messages = await this.getAllMessages();
      const filteredMessages = messages.filter(m => m.contactId !== contactId);

      localStorage.setItem(this.storageKey, JSON.stringify(filteredMessages));
      return true;
    } catch (error) {
      console.error('Failed to delete messages for contact:', error);
      throw error;
    }
  }

  /**
   * Search messages by content
   */
  async searchMessages(searchTerm, contactId = null) {
    try {
      const messages = await this.getAllMessages();
      const lowerSearchTerm = searchTerm.toLowerCase();

      let filteredMessages = messages;
      if (contactId) {
        filteredMessages = messages.filter(m => m.contactId === contactId);
      }

      return filteredMessages.filter(
        message =>
          message.content &&
          message.content.toLowerCase().includes(lowerSearchTerm),
      );
    } catch (error) {
      console.error('Failed to search messages:', error);
      return [];
    }
  }

  /**
   * Get recent messages across all contacts
   */
  async getRecentMessages(limit = 10) {
    try {
      const messages = await this.getAllMessages();
      return messages
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent messages:', error);
      return [];
    }
  }

  /**
   * Get message statistics
   */
  async getMessageStats() {
    try {
      const messages = await this.getAllMessages();
      const contactCounts = {};
      let encryptedCount = 0;
      let disappearingCount = 0;

      messages.forEach(message => {
        contactCounts[message.contactId] =
          (contactCounts[message.contactId] || 0) + 1;
        if (message.encrypted) encryptedCount++;
        if (message.disappearing) disappearingCount++;
      });

      return {
        totalMessages: messages.length,
        encryptedMessages: encryptedCount,
        disappearingMessages: disappearingCount,
        contactDistribution: contactCounts,
        oldestMessage:
          messages.length > 0
            ? Math.min(...messages.map(m => new Date(m.timestamp)))
            : null,
        newestMessage:
          messages.length > 0
            ? Math.max(...messages.map(m => new Date(m.timestamp)))
            : null,
      };
    } catch (error) {
      console.error('Failed to get message stats:', error);
      return {
        totalMessages: 0,
        encryptedMessages: 0,
        disappearingMessages: 0,
        contactDistribution: {},
        oldestMessage: null,
        newestMessage: null,
      };
    }
  }

  /**
   * Clear all messages (for reset/logout)
   */
  async clearAllMessages() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Failed to clear messages:', error);
      throw error;
    }
  }

  /**
   * Clean up expired disappearing messages
   */
  async cleanupExpiredMessages() {
    try {
      const messages = await this.getAllMessages();
      const now = new Date();
      const validMessages = [];

      messages.forEach(message => {
        if (message.disappearing && message.expiresAt) {
          const expirationTime = new Date(message.expiresAt);
          if (now < expirationTime) {
            validMessages.push(message);
          }
        } else if (!message.disappearing) {
          validMessages.push(message);
        }
      });

      localStorage.setItem(this.storageKey, JSON.stringify(validMessages));
      return messages.length - validMessages.length; // Return count of cleaned messages
    } catch (error) {
      console.error('Failed to cleanup expired messages:', error);
      return 0;
    }
  }

  /**
   * Export messages for backup
   */
  async exportMessages(contactId = null) {
    try {
      let messages = await this.getAllMessages();

      if (contactId) {
        messages = messages.filter(m => m.contactId === contactId);
      }

      // Remove sensitive data for export
      const exportData = messages.map(message => ({
        ...message,
        encryptedContent: undefined, // Don't export encrypted content
      }));

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export messages:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const messageStorage = new MessageStorage();
export default messageStorage;
