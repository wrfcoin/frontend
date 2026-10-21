import React, { useState } from 'react';
import { Mnemonic } from 'ethers';
import { walletManager } from '../../utils/walletUtils';
import { readVault, saveVault, unlockVault, vaultSupported, VAULT_UNSUPPORTED_MESSAGE, isPasswordSaltedLegacyRecord, LEGACY_PASSWORD_WALLET_NOTICE } from '../../services/walletVault';
import { getSecureWallet, setSecureWallet } from '../../services/secureWalletStorage';
import { clearWalletAuthSession } from '../../services/walletAuthService';
import { useWallet } from '../../contexts/WalletContext.jsx';

const normalize = (words: string) => words.trim().toLowerCase().replace(/\s+/g, ' ');

/** The launch web flow: no persistence or connection before backup verification. */
export default function WebWalletSetup({ onComplete }: { onComplete: (address: string) => void }) {
  const { connectWallet, disconnectWallet } = useWallet();
  const [legacyNotice] = useState(() => vaultSupported() && isPasswordSaltedLegacyRecord(getSecureWallet()) ? LEGACY_PASSWORD_WALLET_NOTICE : null);
  const [mode, setMode] = useState<'select' | 'create' | 'import' | 'unlock'>(readVault() ? 'unlock' : 'select');
  const [phrase, setPhrase] = useState('');
  const [pending, setPending] = useState('');
  const [verification, setVerification] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const resetSecrets = () => {
    setPhrase(''); setPending(''); setVerification(''); setVerifying(false); setAcknowledged(false);
    setPassword(''); setConfirmation('');
  };
  const cancel = () => {
    resetSecrets(); setError(''); setMode(readVault() ? 'unlock' : 'select');
  };
  const requireVaultSupport = () => {
    if (vaultSupported()) return true;
    resetSecrets(); setError(VAULT_UNSUPPORTED_MESSAGE); return false;
  };

  const prepare = async () => {
    if (!requireVaultSupport()) return;
    setError('');
    if (password.length < 8 || password !== confirmation) {
      setError('Use a password of at least 8 characters and confirm it.'); return;
    }
    setBusy(true);
    try {
      const words = normalize(mode === 'create' ? await walletManager.generateNewMnemonic(128) : phrase);
      if (!Mnemonic.isValidMnemonic(words)) throw new Error('Enter a valid BIP-39 recovery phrase, including its checksum.');
      setPending(words); setPhrase(''); setVerification(''); setVerifying(false); setAcknowledged(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot prepare this wallet.');
    } finally { setBusy(false); }
  };

  const activate = async (words: string, expectedAddress?: string) => {
    if (!requireVaultSupport()) return;
    let connecting = false;
    setBusy(true); setError('');
    try {
      if (!Mnemonic.isValidMnemonic(words)) throw new Error('The saved recovery phrase is invalid.');
      const info = await walletManager.createWalletFromMnemonic(words);
      if (expectedAddress && expectedAddress.toLowerCase() !== info.address.toLowerCase()) {
        throw new Error('The saved address does not match these recovery words.');
      }
      if (!expectedAddress) await saveVault(words, info.address, password);
      clearWalletAuthSession();
      connecting = true;
      const result = await connectWallet('custom', { walletData: info });
      if (!result || result.receiveOnly || result.address?.toLowerCase() !== info.address.toLowerCase()) {
        throw new Error('The wallet connection did not verify this address.');
      }
      // Only public metadata survives login. The provider releases its login
      // signer; each Send unlocks the password-encrypted vault afresh.
      setSecureWallet({ address: info.address, publicKey: info.publicKey });
      resetSecrets();
      onComplete(info.address);
    } catch (err) {
      if (connecting) await disconnectWallet().catch(() => {});
      walletManager.lockWallet();
      resetSecrets(); setMode(readVault() ? 'unlock' : 'select');
      setError(err instanceof Error ? err.message : 'Cannot connect this wallet.');
    } finally { setBusy(false); }
  };

  const confirmBackup = async () => {
    // Keep the boundary in the handler as well as the disabled button.
    if (!pending || !verifying || !acknowledged || normalize(verification) !== pending) {
      setError('Write down your recovery words, then enter them again to verify your backup.'); return;
    }
    await activate(pending);
  };
  const unlock = async () => {
    if (!requireVaultSupport()) return;
    setBusy(true); setError('');
    try {
      const saved = await unlockVault(password);
      await activate(normalize(saved.mnemonic), saved.address);
    } catch {
      resetSecrets(); setError(vaultSupported() ? 'Unable to unlock this wallet. Check your password.' : VAULT_UNSUPPORTED_MESSAGE);
    } finally { setBusy(false); }
  };

  if (!vaultSupported()) return <section aria-label="Web wallet setup">
    <h2>Your WRFCoin wallet</h2>
    <p role="alert">{VAULT_UNSUPPORTED_MESSAGE}</p>
    {legacyNotice && <p role="note">{legacyNotice}</p>}
  </section>;

  return <section aria-label="Web wallet setup">
    <h2>Your WRFCoin wallet</h2>
    <p>Your recovery words restore your wallet. Keep an offline backup; anyone with them can use your wallet.</p>
    <p>The password only encrypts this browser’s copy. It is not part of your recovery phrase.</p>
    {legacyNotice && <p role="note">{legacyNotice}</p>}
    {error && <p role="alert">{error}</p>}
    {mode === 'select' && <>
      <button type="button" onClick={() => { setError(''); setMode('create'); }}>Create New Wallet</button>
      <button type="button" onClick={() => { setError(''); setMode('import'); }}>Import Recovery Phrase</button>
    </>}
    {mode === 'unlock' && <>
      <p>A wallet is encrypted in this browser. Unlock it to connect.</p>
      <label>Browser password<input type="password" autoComplete="current-password" value={password} disabled={busy} onChange={e => setPassword(e.target.value)} /></label>
      <button type="button" disabled={busy || !password} onClick={unlock}>Unlock Wallet</button>
      <button type="button" disabled={busy} onClick={() => { resetSecrets(); setError(''); setMode('import'); }}>Recover this wallet from words</button>
    </>}
    {(mode === 'create' || mode === 'import') && !pending && <>
      {mode === 'import' && <label>Recovery phrase<textarea autoComplete="off" spellCheck={false} value={phrase} disabled={busy} onChange={e => setPhrase(e.target.value)} /></label>}
      <label>Browser password<input type="password" autoComplete="new-password" value={password} disabled={busy} onChange={e => setPassword(e.target.value)} /></label>
      <label>Confirm browser password<input type="password" autoComplete="new-password" value={confirmation} disabled={busy} onChange={e => setConfirmation(e.target.value)} /></label>
      <button type="button" disabled={busy} onClick={prepare}>{mode === 'create' ? 'Generate Recovery Words' : 'Review Backup'}</button>
      <button type="button" disabled={busy} onClick={cancel}>Cancel</button>
    </>}
    {pending && <>
      <h3>Back up your recovery words</h3>
      <p>Write these words in order somewhere safe. This browser is not your backup.</p>
      {!verifying && <>
        <ol aria-label="Recovery words">{pending.split(' ').map((word, i) => <li key={i}>{word}</li>)}</ol>
        <button type="button" onClick={() => setVerifying(true)}>I have written down my words</button>
      </>}
      {verifying && <>
      <label>Verify your backup<textarea autoComplete="off" spellCheck={false} value={verification} disabled={busy} onChange={e => setVerification(e.target.value)} /></label>
      <label><input type="checkbox" checked={acknowledged} disabled={busy} onChange={e => setAcknowledged(e.target.checked)} />I have stored my recovery words safely outside this browser.</label>
      <button type="button" disabled={busy || !acknowledged || normalize(verification) !== pending} onClick={confirmBackup}>Save and Connect Wallet</button>
      </>}
      <button type="button" disabled={busy} onClick={cancel}>Cancel</button>
    </>}
  </section>;
}
