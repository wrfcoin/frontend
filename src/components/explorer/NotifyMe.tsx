import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import { WrfButton } from '../DesignSystem/WrfButton';
import { WrfInput } from '../DesignSystem/WrfInput';
import { palette, borderRadiusScale } from '../DesignSystem/tokens';
import { getAuthToken, subscribeAuthToken } from '../../services/authTokenStore';
import {
  NTFY_TOPIC_RE, createPushSubscription, currentPushSubscription, getNotificationConfig, listSubscriptions,
  removeSubscription, sendTest, sha256Hex, signedInAddress, subscribeNtfy, subscribeWebPush, suggestTopic,
  unsubscribeEndpoint, webPushSupported,
  type NotificationConfig, type NotificationSubscription,
} from '../../services/payoutNotifications';

/**
 * "Notify me when this address is paid" (backend#389) under an address looked up on /explore.
 *
 * Hidden unless the server says notifications are enabled. Needs the wallet login of the looked-up
 * address (the in-memory session from /wallet); anyone else sees how to sign in. Two channels, both
 * anonymous: this browser (Web Push, a push-only service worker) or an ntfy topic the person picks
 * (the free ntfy app). No email, no phone number.
 */

const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

function errorText(code: string | null, status: number | null): string {
  if (code === 'PERMISSION_DENIED') return 'Notifications are blocked for this site in your browser settings.';
  if (status === 401 || code === 'WALLET_LOGIN_REQUIRED') return 'Your wallet session ended. Sign in again on the Wallet page.';
  if (code === 'TOO_MANY_SUBSCRIPTIONS') return 'This address already has the maximum of 10 devices or topics.';
  if (status === 429) return 'Too many requests. Try again in a minute.';
  return 'That did not work. Nothing was changed; please try again.';
}

export default function NotifyMe({ address }: { address: string }) {
  const token = useSyncExternalStore(subscribeAuthToken, getAuthToken, getAuthToken);
  const owner = signedInAddress(token);
  const isOwner = owner === address;
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [subs, setSubs] = useState<NotificationSubscription[] | null>(null);
  const [thisBrowserHash, setThisBrowserHash] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const controller = new globalThis.AbortController();
    getNotificationConfig(controller.signal).then(r => setConfig(r.ok ? r.value : null)).catch(() => {});
    return () => controller.abort();
  }, []);

  const refresh = useCallback(async () => {
    const r = await listSubscriptions(address);
    setSubs(r.ok ? r.value : []);
    try {
      const existing = await currentPushSubscription();
      setThisBrowserHash(existing ? await sha256Hex(existing.endpoint) : null);
    } catch { setThisBrowserHash(null); }
  }, [address]);

  useEffect(() => {
    if (config?.enabled && isOwner) void refresh().catch(() => {});
  }, [config, isOwner, refresh]);

  if (!config?.enabled) return null;

  const run = async (action: () => Promise<{ ok: boolean; status?: number | null; code?: string | null }>, success: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const r = await action();
      setMessage(r.ok ? { tone: 'ok', text: success } : { tone: 'error', text: errorText(r.code ?? null, r.status ?? null) });
      await refresh();
    } catch (e) {
      setMessage({ tone: 'error', text: errorText((e as { code?: string })?.code ?? null, null) });
    } finally { setBusy(false); }
  };

  const browserSub = subs?.find(s => s.channel === 'webpush' && s.targetHash === thisBrowserHash) ?? null;
  const ntfySubs = subs?.filter(s => s.channel === 'ntfy') ?? [];
  const pushAvailable = config.webPush.available && !!config.webPush.publicKey && webPushSupported();

  return (
    <Box
      data-testid="notify-me"
      sx={{ mt: 2, p: 2, borderRadius: `${borderRadiusScale.md}px`, backgroundColor: palette.background.row, '& a': { color: palette.text.link } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <NotificationsActiveOutlinedIcon fontSize="small" sx={{ color: palette.text.secondary }} />
        <Typography component="h3" sx={{ m: 0, fontSize: '1rem', fontWeight: 700, color: palette.text.primary }}>
          Notify me when this address is paid
        </Typography>
      </Box>
      <Typography sx={{ mt: 0.5, fontSize: '0.8125rem', color: palette.text.secondary }}>
        Node, station, forecast and producer pay all count. Checked about every {config.checkEveryMinutes} minutes.
        No email or name: only this browser&apos;s push address or a topic you choose is kept.
      </Typography>

      {!isOwner ? (
        <Typography data-testid="notify-me-signin" sx={{ mt: 1.5, fontSize: '0.875rem', color: palette.text.primary }}>
          To turn this on, <RouterLink to="/wallet">sign in with this address&apos;s wallet</RouterLink>, then look it up again.
        </Typography>
      ) : (
        <Box sx={{ mt: 1.5, display: 'grid', gap: 1.5 }}>
          {pushAvailable && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: '0.875rem', color: palette.text.primary, flex: '1 1 200px' }}>
                This browser: <strong>{browserSub ? 'on' : 'off'}</strong>
              </Typography>
              {browserSub ? (
                <>
                  <WrfButton variant="secondary" size="sm" disabled={busy} onClick={() => run(() => sendTest(browserSub.id), 'Test sent. It should appear in a few seconds.')}>Send a test</WrfButton>
                  <WrfButton
                    variant="secondary" size="sm" disabled={busy}
                    onClick={() => run(async () => {
                      const existing = await currentPushSubscription();
                      const r = existing ? await unsubscribeEndpoint(existing.endpoint, address) : await removeSubscription(browserSub.id);
                      await existing?.unsubscribe().catch(() => false);
                      return r;
                    }, 'Turned off for this browser.')}
                  >
                    Turn off
                  </WrfButton>
                </>
              ) : (
                <WrfButton
                  variant="primary" size="sm" disabled={busy} data-testid="notify-me-push-on"
                  onClick={() => run(async () => subscribeWebPush(address, await createPushSubscription(config.webPush.publicKey as string)), 'On. This browser will show a notification when this address is paid.')}
                >
                  Turn on in this browser
                </WrfButton>
              )}
            </Box>
          )}

          {config.ntfy.available && (
            <Box>
              <Typography sx={{ fontSize: '0.875rem', color: palette.text.primary }}>
                Or on your phone with the free <a href="https://ntfy.sh/" target="_blank" rel="noopener noreferrer">ntfy app</a>: subscribe to a topic there, then add it here.
                Anyone who knows the topic can read it, so keep the random one.
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, alignItems: { xs: 'stretch', sm: 'flex-start' } }}>
                <WrfInput
                  label="ntfy topic"
                  value={topic}
                  placeholder="wrfcoin-pay-…"
                  onChange={e => setTopic(e.target.value.trim())}
                  error={topic !== '' && !NTFY_TOPIC_RE.test(topic)}
                  errorMessage="12 to 64 letters, digits, - or _."
                  autoComplete="off"
                  spellCheck={false}
                  slotProps={{ htmlInput: { 'data-testid': 'notify-me-topic', style: { fontFamily: mono } } }}
                />
                <WrfButton variant="secondary" size="md" disabled={busy} onClick={() => setTopic(suggestTopic())} sx={{ flexShrink: 0, minHeight: 40 }}>Random topic</WrfButton>
                <WrfButton
                  variant="primary" size="md" disabled={busy || !NTFY_TOPIC_RE.test(topic)} data-testid="notify-me-ntfy-add" sx={{ flexShrink: 0, minHeight: 40 }}
                  onClick={() => run(() => subscribeNtfy(address, topic), `Added. Subscribe to "${topic}" in the ntfy app.`)}
                >
                  Add topic
                </WrfButton>
              </Box>
              {ntfySubs.length > 0 && (
                <Box component="ul" sx={{ m: 0, mt: 1, p: 0, listStyle: 'none', display: 'grid', gap: 0.75 }}>
                  {ntfySubs.map(s => (
                    <Box component="li" key={s.id} sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontFamily: mono, fontSize: '0.8125rem', color: palette.text.primary, flex: '1 1 200px', overflowWrap: 'anywhere' }}>{s.label}</Typography>
                      <WrfButton variant="secondary" size="sm" disabled={busy} onClick={() => run(() => sendTest(s.id), 'Test sent to the topic.')}>Send a test</WrfButton>
                      <WrfButton variant="secondary" size="sm" disabled={busy} onClick={() => run(() => removeSubscription(s.id), 'Topic removed.')}>Remove</WrfButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {!pushAvailable && !config.ntfy.available && (
            <Typography sx={{ fontSize: '0.875rem', color: palette.text.secondary }}>No notification channel is set up on this server yet.</Typography>
          )}
        </Box>
      )}

      {message && (
        <Typography role="status" data-testid="notify-me-message" sx={{ mt: 1.5, fontSize: '0.8125rem', color: message.tone === 'ok' ? palette.success.light : palette.error.light }}>
          {message.text}
        </Typography>
      )}
    </Box>
  );
}
