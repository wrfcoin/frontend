/**
 * Base Wallet Provider Interface
 * Defines the standard interface that all wallet providers must implement
 */

export class BaseWalletProvider {
  constructor(config = {}) {
    this.config = config;
    this.isConnected = false;
    this.account = null;
    this.chainId = null;
    this.provider = null;
  }

  /**
   * Get provider type identifier
   * @returns {string} Provider type (e.g., 'metamask', 'walletconnect', 'custom')
   */
  getType() {
    throw new Error('getType() must be implemented by wallet provider');
  }

  /**
   * Get provider display name
   * @returns {string} Human-readable provider name
   */
  getName() {
    throw new Error('getName() must be implemented by wallet provider');
  }

  /**
   * Check if provider is available in current environment
   * @returns {boolean} True if provider is available
   */
  isAvailable() {
    throw new Error('isAvailable() must be implemented by wallet provider');
  }

  /**
   * Connect to wallet
   * @returns {Promise<{address: string, chainId: string}>} Connection result
   */
  async connect() {
    throw new Error('connect() must be implemented by wallet provider');
  }

  /**
   * Disconnect from wallet
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error('disconnect() must be implemented by wallet provider');
  }

  /**
   * Get current account address
   * @returns {string|null} Current account address
   */
  getAccount() {
    return this.account;
  }

  /**
   * Get current chain ID
   * @returns {string|null} Current chain ID
   */
  getChainId() {
    return this.chainId;
  }

  /**
   * Get account balance
   * @param {string} address Account address
   * @returns {Promise<string>} Balance in wei
   */
  async getBalance(address) {
    throw new Error('getBalance() must be implemented by wallet provider');
  }

  /**
   * Send transaction
   * @param {Object} transaction Transaction object
   * @returns {Promise<string>} Transaction hash
   */
  async sendTransaction(transaction) {
    throw new Error('sendTransaction() must be implemented by wallet provider');
  }

  /**
   * Sign message
   * @param {string} message Message to sign
   * @returns {Promise<string>} Signature
   */
  async signMessage(message) {
    throw new Error('signMessage() must be implemented by wallet provider');
  }

  /**
   * Switch to specified chain
   * @param {string} chainId Target chain ID
   * @returns {Promise<boolean>} Success status
   */
  async switchChain(chainId) {
    throw new Error('switchChain() must be implemented by wallet provider');
  }

  /**
   * Add event listener
   * @param {string} event Event name
   * @param {Function} callback Event handler
   */
  on(event, callback) {
    throw new Error('on() must be implemented by wallet provider');
  }

  /**
   * Remove event listener
   * @param {string} event Event name
   * @param {Function} callback Event handler
   */
  off(event, callback) {
    throw new Error('off() must be implemented by wallet provider');
  }

  /**
   * Get provider icon URL or component
   * @returns {string} Icon URL or component name
   */
  getIcon() {
    return 'account_balance_wallet';
  }

  /**
   * Validate if this provider can handle the given operation
   * @param {string} operation Operation name
   * @returns {boolean} True if operation is supported
   */
  supportsOperation(operation) {
    const supportedOperations = [
      'connect',
      'disconnect',
      'getBalance',
      'sendTransaction',
      'signMessage',
      'switchChain',
    ];
    return supportedOperations.includes(operation);
  }
}
