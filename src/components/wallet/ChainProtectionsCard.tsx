import React, { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import UsbIcon from '@mui/icons-material/Usb';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { WrfCard } from '../DesignSystem/WrfCard';
import { WrfBadge } from '../DesignSystem/WrfBadge';
import { WrfButton } from '../DesignSystem/WrfButton';
import { WrfInput } from '../DesignSystem/WrfInput';
import { WrfAlert } from '../DesignSystem/WrfAlert';
import { palette } from '../DesignSystem/tokens';
import { useAddressBook } from '../../services/addressBook/useAddressBook';
import { useChainProtections, useNow, type ChainProtections } from '../../services/walletCrypto/useChainProtections';
import { heightEtaMs, type SecurityKeyStatus, type SendAllowlistRead } from '../../services/walletCrypto/protections';
import {
  addSecurityKey,
  cancelSecurityKeyEscape,
  enableSecurityKey,
  submitAllowlistAction,
} from '../../services/walletCrypto/protectionActions';
import {
  ALLOWLIST_DEFAULT_DELAY_BLOCKS,
  ALLOWLIST_MAX_ADDRESSES,
  ALLOWLIST_MAX_DELAY_BLOCKS,
  ALLOWLIST_MAX_PENDING,
  ALLOWLIST_MIN_DELAY_BLOCKS,
  SECURITY_KEY_ESCAPE_DEFAULT_BLOCKS,
  SECURITY_KEY_MAX_KEYS,
  aboutBlocks,
  formatCountdown,
  type SendAllowlistAction,
} from '../../services/walletCrypto/chainProtections';

/**
 * "Account protection" on the 12-word wallet: two rules the chain itself enforces, whatever app or copy of
 * the phrase signs. Renders nothing unless this build has the flag on and the node says at least one of
 * the features is active, so visitors never see a control the chain would refuse.
 */

export const SECURITY_KEY_SUMMARY =
  'Every send then needs your wallet password and a touch plus PIN on your YubiKey. Someone who learns your 12 words alone cannot move your WRF.';
const ESCAPE_DAYS = Math.round((SECURITY_KEY_ESCAPE_DEFAULT_BLOCKS * 77) / 86400);
export const ESCAPE_NOTE =
  `Lost your key? Your 12 words alone can turn this off, but only after a ${ESCAPE_DAYS}-day wait. Your key can cancel that wait.`;
export const NO_BOND_NOTE = 'While it is on, this wallet cannot bond a node yet.';
export const ALLOWLIST_SUMMARY =
  'The chain refuses every send from this wallet to an address that is not on your list, even one signed with your 12 words elsewhere. Receiving is never limited.';
export const ALLOWLIST_LIMITS_NOTE =
  'While it is on, governance deposits and sponsoring other wallets are refused. To hand a weather station to someone, put their address on the list first.';
export const SENT_MESSAGE = 'Sent to the network. It shows here once the next block includes it (about a minute).';

const DELAY_CHOICES: { label: string; blocks: number }[] = [
  { label: '24 hours', blocks: ALLOWLIST_MIN_DELAY_BLOCKS },
  { label: '48 hours (recommended)', blocks: ALLOWLIST_DEFAULT_DELAY_BLOCKS },
  { label: '7 days', blocks: 7_855 },
  { label: '30 days', blocks: ALLOWLIST_MAX_DELAY_BLOCKS },
];

const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const mask = (a: string) => (a.length <= 20 ? a : `${a.slice(0, 10)}…${a.slice(-8)}`);
const bodySx = { color: palette.text.secondary, fontSize: '0.875rem', m: 0 } as const;
const h3Sx = { fontSize: '0.9375rem', fontWeight: 700, m: 0, display: 'flex', alignItems: 'center', gap: 0.75 } as const;
const sectionSx = { display: 'flex', flexDirection: 'column', gap: 1.25, py: 1.5, '& + &': { borderTop: '1px solid var(--border-default, rgba(148, 163, 184, 0.3))' } } as const;
const whenText = (ms: number) => new Date(ms).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** Errors the relay/node can return, in words; anything else gets a generic line. */
function actionError(e: unknown): string {
  const msg = e instanceof Error ? e.message : '';
  const code = (e as { details?: { code?: unknown } } | null)?.details?.code;
  if (code === 'FEATURE_NOT_ACTIVE') return 'This protection is not on in the network yet.';
  if (typeof code === 'string' && /REJECTED|REFUSED|AUTHORIZATION/.test(code)) {
    return /cooldown/i.test(msg) ? 'You cancelled a change recently, so new requests are paused for about 12 hours.' : `The network refused it: ${msg || code}`;
  }
  return msg && msg.length < 200 ? msg : 'Could not send that. Check your password and try again.';
}

/** Password once, then run the action. One confirm panel serves every action in the card. */
interface Confirm { title: string; detail?: string; button: string; run: (password: string) => Promise<void> }

function ConfirmPanel({ confirm, busy, onRun, onCancel }: { confirm: Confirm; busy: boolean; onRun: (pw: string) => void; onCancel: () => void }) {
  const password = useRef<HTMLInputElement>(null);
  return (
    <Box data-testid="protection-confirm" sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, p: 1.5, borderRadius: '10px', backgroundColor: palette.background.row }}>
      <Typography sx={{ fontWeight: 600, m: 0 }}>{confirm.title}</Typography>
      {confirm.detail && <Typography sx={bodySx}>{confirm.detail}</Typography>}
      <WrfInput
        ref={password}
        type="password"
        label="Wallet password"
        autoComplete="off"
        disabled={busy}
        prefixIcon={<LockOutlinedIcon fontSize="small" />}
        helperText="Unlocks your recovery phrase once to sign. Not stored."
      />
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <WrfButton variant="primary" size="sm" loading={busy} disabled={busy} onClick={() => {
          const pw = password.current?.value ?? '';
          if (password.current) password.current.value = '';
          onRun(pw);
        }}>{confirm.button}</WrfButton>
        <WrfButton variant="ghost" size="sm" disabled={busy} onClick={onCancel}>Cancel</WrfButton>
      </Box>
    </Box>
  );
}

function SecurityKeySection({ status, fetchedAt, now, ask }: { status: SecurityKeyStatus; fetchedAt: number; now: number; ask: (c: Confirm) => void }) {
  const on = status.keys.length > 0 && status.required_to_spend;
  const escape = status.pending_escape;
  return (
    <Box component="section" aria-label="Require my YubiKey to spend" data-testid="security-key-section" sx={sectionSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Typography component="h3" sx={h3Sx}><UsbIcon fontSize="small" />Require my YubiKey to spend</Typography>
        <WrfBadge status={on ? 'active' : status.escape_matured ? 'warning' : 'neutral'} label={on ? 'On' : status.escape_matured ? 'Lapsed' : 'Off'} />
      </Box>
      <Typography sx={bodySx}>{SECURITY_KEY_SUMMARY}</Typography>
      <Box component="ul" sx={{ ...bodySx, m: 0, pl: 2.5, display: 'grid', gap: 0.5 }}>
        <li data-testid="security-key-max">Up to {SECURITY_KEY_MAX_KEYS} keys: register a spare so a lost key is replaced at once.</li>
        <li data-testid="security-key-escape">{ESCAPE_NOTE}</li>
        <li>{NO_BOND_NOTE}</li>
      </Box>
      {escape && !status.escape_matured && (
        <WrfAlert severity="error" title="Someone asked to turn off your YubiKey requirement" data-testid="security-key-escape-pending">
          With your 12 words alone, it turns off in {formatCountdown(heightEtaMs(status.next_height, escape.executable_at_height, fetchedAt) - now)} (block {escape.executable_at_height.toLocaleString()}).
          If this was not you, cancel it with your key now, then move your WRF to a new wallet.
          <Box sx={{ mt: 1 }}>
            <WrfButton variant="primary" size="sm" onClick={() => ask({
              title: 'Cancel the turn-off', detail: 'Your YubiKey will ask for a touch and PIN.', button: 'Cancel it with my key',
              run: pw => cancelSecurityKeyEscape({ owner: status.address, password: pw, status }),
            })}>Cancel with my key</WrfButton>
          </Box>
        </WrfAlert>
      )}
      {on ? (
        <>
          <Typography sx={bodySx} data-testid="security-key-count">
            {status.keys.length} of {SECURITY_KEY_MAX_KEYS} keys registered. Turn-off wait: {aboutBlocks(status.escape_delay_blocks ?? SECURITY_KEY_ESCAPE_DEFAULT_BLOCKS).replace('about ', '')}.
          </Typography>
          {status.keys.length < SECURITY_KEY_MAX_KEYS && !escape && (
            <Box>
              <WrfButton variant="outline" size="sm" onClick={() => ask({
                title: 'Add a spare key', detail: 'Touch your current key first, then the new one.', button: 'Add key',
                run: pw => addSecurityKey({ owner: status.address, password: pw, status }),
              })}>Add a spare key</WrfButton>
            </Box>
          )}
        </>
      ) : (
        <Box>
          <WrfButton variant="primary" size="sm" startIcon={<UsbIcon fontSize="small" />} data-testid="security-key-enable" onClick={() => ask({
            title: 'Require my YubiKey to spend',
            detail: 'Plug in your YubiKey. It will ask for a touch and PIN twice: once to register, once to sign.',
            button: 'Turn on',
            run: pw => enableSecurityKey({ owner: status.address, password: pw, status }),
          })}>Turn on</WrfButton>
        </Box>
      )}
    </Box>
  );
}

function AddressLine({ address, name, children }: { address: string; name: string | null; children?: React.ReactNode }) {
  return (
    <Box component="li" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', py: 0.75 }}>
      <Box sx={{ minWidth: 0, flex: '1 1 180px' }}>
        {name && <Typography sx={{ fontWeight: 600, m: 0, fontSize: '0.875rem', overflowWrap: 'anywhere' }}>{name}</Typography>}
        <Typography title={address} sx={{ fontFamily: mono, fontSize: '0.75rem', color: palette.text.secondary, m: 0 }}>{mask(address)}</Typography>
      </Box>
      {children}
    </Box>
  );
}

function parseAddresses(text: string): string[] | null {
  const list = [...new Set(text.split(/[\s,]+/).map(s => s.trim().toLowerCase()).filter(Boolean))];
  return list.every(a => /^0x[0-9a-f]{40}$/.test(a)) ? list : null;
}

function AllowlistSection({ owner, read, fetchedAt, now, ask }: { owner: string; read: SendAllowlistRead; fetchedAt: number; now: number; ask: (c: Confirm) => void }) {
  const { book } = useAddressBook();
  const nameOf = (a: string) => book.contacts.find(c => c.address === a)?.name ?? null;
  const v = read.allowlist;
  const [delay, setDelay] = useState(ALLOWLIST_DEFAULT_DELAY_BLOCKS);
  const [initial, setInitial] = useState('');
  const [adding, setAdding] = useState('');
  const [inputError, setInputError] = useState('');
  const eta = (h: number) => heightEtaMs(v.at_height, h, fetchedAt);
  const act = (title: string, action: SendAllowlistAction, detail?: string, button = 'Sign and send') =>
    ask({ title, detail, button, run: pw => submitAllowlistAction({ owner, password: pw, read, action }) });
  const count = v.allowed.length + v.pending_additions.length;
  const paused = v.requests_blocked_until_height !== null && v.requests_blocked_until_height > v.at_height;

  return (
    <Box component="section" aria-label="Send allowlist on chain" data-testid="chain-allowlist-section" sx={sectionSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Typography component="h3" sx={h3Sx}><PlaylistAddCheckIcon fontSize="small" />Only send to my list</Typography>
        <WrfBadge status={v.in_force ? 'active' : 'neutral'} label={v.in_force ? 'On' : 'Off'} />
      </Box>
      <Typography sx={bodySx}>{ALLOWLIST_SUMMARY}</Typography>
      <Typography sx={bodySx}>{ALLOWLIST_LIMITS_NOTE}</Typography>

      {!v.in_force && (
        <>
          <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography component="legend" sx={{ ...bodySx, fontWeight: 600, mb: 0.5 }}>New addresses wait</Typography>
            {DELAY_CHOICES.map(c => (
              <label key={c.blocks} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.875rem' }}>
                <input type="radio" name="allowlist-delay" checked={delay === c.blocks} onChange={() => setDelay(c.blocks)} />
                {c.label}
              </label>
            ))}
          </Box>
          <WrfInput
            label="Addresses you can send to"
            value={initial}
            onChange={e => { setInitial(e.target.value); setInputError(''); }}
            multiline
            minRows={2}
            spellCheck={false}
            helperText="One 0x address per line. These work at once; ones you add later wait."
            slotProps={{ input: { sx: { fontFamily: mono, fontSize: '0.8125rem' } } }}
          />
          {book.contacts.length > 0 && (
            <Box>
              <WrfButton variant="ghost" size="sm" onClick={() => setInitial(book.contacts.map(c => c.address).slice(0, ALLOWLIST_MAX_ADDRESSES).join('\n'))}>
                Use my address book ({Math.min(book.contacts.length, ALLOWLIST_MAX_ADDRESSES)})
              </WrfButton>
            </Box>
          )}
          {inputError && <WrfAlert severity="error">{inputError}</WrfAlert>}
          <Box>
            <WrfButton variant="primary" size="sm" data-testid="chain-allowlist-enable" onClick={() => {
              const list = parseAddresses(initial);
              if (!list) { setInputError('Enter full 0x addresses (40 hex digits), one per line.'); return; }
              const own = list.filter(a => a !== owner.toLowerCase()).slice(0, ALLOWLIST_MAX_ADDRESSES);
              act('Turn on your send allowlist', { kind: 'enable', addDelayBlocks: delay, allowed: own },
                `Starts now with ${own.length} address${own.length === 1 ? '' : 'es'}. New ones will wait ${aboutBlocks(delay).replace('about ', 'about ')}. Turning it off later waits as long.`, 'Turn on');
            }}>Turn on</WrfButton>
          </Box>
        </>
      )}

      {v.in_force && (
        <>
          <Typography sx={bodySx} data-testid="chain-allowlist-delay">
            New addresses wait {aboutBlocks(v.add_delay_blocks ?? ALLOWLIST_DEFAULT_DELAY_BLOCKS)}. {count} of {ALLOWLIST_MAX_ADDRESSES} addresses used.
          </Typography>

          {v.pending_additions.length > 0 && (
            <Box data-testid="chain-allowlist-pending">
              <Typography sx={{ ...bodySx, fontWeight: 600 }}>Waiting to be added</Typography>
              <WrfAlert severity="warning" sx={{ my: 1 }}>
                If you did not add one of these, cancel it now and move your WRF to a new wallet: someone may have your 12 words.
              </WrfAlert>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {v.pending_additions.map(p => (
                  <AddressLine key={p.address} address={p.address} name={nameOf(p.address)}>
                    <Typography component="span" data-testid="chain-allowlist-countdown" sx={{ fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}
                      title={`Usable from block ${p.effective_at_height.toLocaleString()}, around ${whenText(eta(p.effective_at_height))}`}>
                      {formatCountdown(eta(p.effective_at_height) - now)}
                    </Typography>
                    <WrfButton variant="outline" size="sm" onClick={() => act('Cancel this addition', { kind: 'cancel_add', address: p.address },
                      'It never becomes usable. After a cancel, new requests pause for about 12 hours.')}>Cancel</WrfButton>
                  </AddressLine>
                ))}
              </Box>
            </Box>
          )}

          <Box>
            <Typography sx={{ ...bodySx, fontWeight: 600 }}>You can send to</Typography>
            {v.allowed.length === 0 ? <Typography sx={bodySx}>Only your own address for now.</Typography> : (
              <Box component="ul" data-testid="chain-allowlist-allowed" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {v.allowed.map(a => (
                  <AddressLine key={a} address={a} name={nameOf(a)}>
                    <WrfButton variant="ghost" size="sm" onClick={() => act('Remove this address', { kind: 'remove', address: a },
                      'Removing works at once. Adding it back waits the full delay.', 'Remove')}>Remove</WrfButton>
                  </AddressLine>
                ))}
              </Box>
            )}
          </Box>

          {paused ? (
            <Typography sx={bodySx}>New requests are paused until about {whenText(eta(v.requests_blocked_until_height ?? 0))} because a change was cancelled.</Typography>
          ) : !v.pending_disable && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 240px', minWidth: 0 }}>
                <WrfInput label="Add an address" value={adding} onChange={e => { setAdding(e.target.value); setInputError(''); }} autoComplete="off" spellCheck={false}
                  helperText={`Usable in ${aboutBlocks(v.add_delay_blocks ?? ALLOWLIST_DEFAULT_DELAY_BLOCKS).replace('about ', 'about ')}.`}
                  slotProps={{ input: { sx: { fontFamily: mono, fontSize: '0.8125rem' } } }} />
              </Box>
              <WrfButton variant="outline" size="sm" sx={{ mt: { xs: 0, sm: 1 } }} data-testid="chain-allowlist-add"
                disabled={v.pending_additions.length >= ALLOWLIST_MAX_PENDING || count >= ALLOWLIST_MAX_ADDRESSES}
                onClick={() => {
                  const a = adding.trim().toLowerCase();
                  if (!/^0x[0-9a-f]{40}$/.test(a)) { setInputError('Enter a full 0x address (40 hex digits).'); return; }
                  if (a === owner.toLowerCase()) { setInputError('You can always send to yourself; no need to list it.'); return; }
                  if (v.allowed.includes(a) || v.pending_additions.some(p => p.address === a)) { setInputError('That address is already on the list.'); return; }
                  act('Add to your list', { kind: 'request_add', address: a },
                    `It becomes usable in ${aboutBlocks(v.add_delay_blocks ?? ALLOWLIST_DEFAULT_DELAY_BLOCKS)}. You can cancel it until then.`);
                }}>Add</WrfButton>
            </Box>
          )}
          {inputError && <WrfAlert severity="error">{inputError}</WrfAlert>}

          {v.pending_disable ? (
            <WrfAlert severity="warning" title="Turning off" data-testid="chain-allowlist-disable-pending">
              The list stays on for {formatCountdown(eta(v.pending_disable.effective_at_height) - now)}. If you did not ask for this, cancel it now.
              <Box sx={{ mt: 1 }}>
                <WrfButton variant="primary" size="sm" onClick={() => act('Keep the list on', { kind: 'cancel_disable' })}>Keep it on</WrfButton>
              </Box>
            </WrfAlert>
          ) : !paused && (
            <Box>
              <WrfButton variant="ghost" size="sm" onClick={() => act('Turn the list off', { kind: 'request_disable' },
                `It stays on for ${aboutBlocks(v.add_delay_blocks ?? ALLOWLIST_DEFAULT_DELAY_BLOCKS)}, and you can cancel during that time.`, 'Turn off')}>Turn off…</WrfButton>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

/** The card itself; `protections` is injectable for tests and screenshots. */
export function ChainProtectionsView({ owner, protections }: { owner: string; protections: ChainProtections }) {
  const { securityKey, allowlist, fetchedAt, loading, reload } = protections;
  const ticking = !!(allowlist?.allowlist.pending_additions.length || allowlist?.allowlist.pending_disable || securityKey?.pending_escape);
  const now = useNow(ticking);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  if (loading || (!securityKey && !allowlist)) return null;

  const ask = (c: Confirm) => { setConfirm(c); setError(''); setSent(false); };
  const run = async (pw: string) => {
    if (!confirm || busy) return;
    if (!pw) { setError('Enter your wallet password.'); return; }
    setBusy(true); setError('');
    try {
      await confirm.run(pw);
      setConfirm(null); setSent(true);
      await reload();
    } catch (e) {
      setError(actionError(e));
    } finally { setBusy(false); }
  };

  return (
    <WrfCard
      component="section"
      aria-label="Account protection"
      variant="outlined"
      header={<Typography component="h2" sx={{ fontSize: '1.0625rem', fontWeight: 700, m: 0 }}>Account protection</Typography>}
      headerAction={<WrfBadge status="info" label="On chain" />}
      footer={
        <WrfButton variant="ghost" size="sm" startIcon={<RefreshIcon fontSize="small" />} onClick={() => void reload()} disabled={busy}>Refresh</WrfButton>
      }
      sx={{ backgroundColor: palette.background.secondary, borderRadius: '16px' }}
      data-testid="chain-protections"
    >
      {sent && <WrfAlert severity="success" sx={{ mb: 1 }} role="status">{SENT_MESSAGE}</WrfAlert>}
      {error && <WrfAlert severity="error" sx={{ mb: 1 }}>{error}</WrfAlert>}
      {confirm && <ConfirmPanel confirm={confirm} busy={busy} onRun={pw => void run(pw)} onCancel={() => { setConfirm(null); setError(''); }} />}
      {securityKey && <SecurityKeySection status={{ ...securityKey, address: securityKey.address || owner }} fetchedAt={fetchedAt} now={now} ask={ask} />}
      {allowlist && <AllowlistSection owner={owner} read={allowlist} fetchedAt={fetchedAt} now={now} ask={ask} />}
    </WrfCard>
  );
}

export default function ChainProtectionsCard({ ownerAddress }: { ownerAddress: string | null }) {
  const protections = useChainProtections(ownerAddress);
  if (!ownerAddress) return null;
  return <ChainProtectionsView owner={ownerAddress} protections={protections} />;
}
