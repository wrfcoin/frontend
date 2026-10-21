// Stub Security Service for forgotten UI components

const defaultSettings = {
  nodeId: 'default',
  mevProtection: true,
  privacyLevel: 'standard',
  autoLock: true,
  lockTimeout: 300,
  twoFactorEnabled: false,
  whitelistedAddresses: [],
  transactionLimit: 1000,
};

export const securityService = {
  getSecuritySettings: async (nodeId) => {
    // Return default settings for demo purposes
    return { ...defaultSettings, nodeId };
  },

  createSecuritySettings: async (settings) => {
    return { ...defaultSettings, ...settings, id: Date.now() };
  },

  updateSecuritySettings: async (nodeId, updates) => {
    return { ...defaultSettings, nodeId, ...updates, updatedAt: new Date().toISOString() };
  },

  deleteSecuritySettings: async (nodeId) => {
    return { success: true, nodeId };
  },

  validateSettings: async (settings) => {
    return { valid: true, settings };
  },
};

export default securityService;
