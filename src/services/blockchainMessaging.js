export const MESSAGING_UNAVAILABLE = 'Blockchain messaging is unavailable: no supported delivery protocol is configured';

/** Unsupported delivery never yields a receipt, readiness or an empty history. */
export default class BlockchainMessagingService {
  constructor() {
    this.isConnected = false;
    this.userAddress = null;
    this.messagingProtocol = null;
    this.pushProtocolChannel = null;
  }
  async connectWallet() { throw new Error(MESSAGING_UNAVAILABLE); }
  async initializeXMTPClient() { throw new Error(MESSAGING_UNAVAILABLE); }
  async initializePushProtocol() { throw new Error(MESSAGING_UNAVAILABLE); }
  async sendMessage() { throw new Error(MESSAGING_UNAVAILABLE); }
  async canReceiveMessages() { throw new Error(MESSAGING_UNAVAILABLE); }
  async sendXMTPMessage() { throw new Error(MESSAGING_UNAVAILABLE); }
  async sendPushNotification() { throw new Error(MESSAGING_UNAVAILABLE); }
  async getMessageHistory() { throw new Error(MESSAGING_UNAVAILABLE); }
  async setupMessageListener() { throw new Error(MESSAGING_UNAVAILABLE); }
}
