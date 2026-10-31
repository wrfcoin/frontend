import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import { WrfCard } from '../DesignSystem/WrfCard';
import { WrfInput } from '../DesignSystem/WrfInput';
import { WrfButton } from '../DesignSystem/WrfButton';
import { WrfSkeleton } from '../DesignSystem/WrfSkeleton';
import { palette, borderRadiusScale } from '../DesignSystem/tokens';
import { formatBaseUnitsToWrf } from '../../services/apiClient/number';
import {
  lookupPublicAddress,
  normalizeLookupAddress,
  type PublicAddressBalance,
} from '../../services/publicAddressBalance';

/**
 * Address box on the public explorer (/explore): paste a 0x or wrf address and see its balance and
 * what it has earned in total. Node pay is credited straight to the payout account with no
 * transaction, so the block list never shows it; the earned total is where it shows.
 */

type View =
  | { kind: 'idle' }
  | { kind: 'loading'; address: string }
  | { kind: 'ready'; value: PublicAddressBalance }
  | { kind: 'off' }
  | { kind: 'busy' }
  | { kind: 'unavailable' };

const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

/** "1,234.56789012 WRF" with all 8 decimals; null when the units are missing or malformed. */
export function wrfText(units: string | null): string | null {
  const text = units === null ? null : formatBaseUnitsToWrf(units, 8);
  return text === null ? null : `${text} WRF`;
}

const Amount: React.FC<{ label: string; units: string | null; note: string; testId: string }> = ({ label, units, note, testId }) => {
  const text = wrfText(units);
  return (
    <Box
      data-testid={testId}
      sx={{ p: 2, borderRadius: `${borderRadiusScale.md}px`, backgroundColor: palette.background.row, minWidth: 0 }}
    >
      <Typography component="h3" sx={{ m: 0, fontSize: '0.75rem', fontWeight: 600, color: palette.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Typography>
      <Typography
        sx={{ mt: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem' }, fontWeight: 700, color: text ? palette.text.primary : palette.text.muted, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}
      >
        {text ?? 'Unavailable'}
      </Typography>
      <Typography sx={{ mt: 0.5, fontSize: '0.8125rem', color: palette.text.secondary }}>{note}</Typography>
    </Box>
  );
};

const Message: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box role="status" data-testid="address-lookup-message" sx={{ p: 2, borderRadius: `${borderRadiusScale.md}px`, backgroundColor: palette.background.row }}>
    <Typography component="h3" sx={{ m: 0, fontSize: '1rem', fontWeight: 700, color: palette.text.primary }}>{title}</Typography>
    <Typography sx={{ mt: 0.5, fontSize: '0.875rem', color: palette.text.secondary }}>{children}</Typography>
  </Box>
);

export default function AddressLookup() {
  const [input, setInput] = useState('');
  const [touched, setTouched] = useState(false);
  const [view, setView] = useState<View>({ kind: 'idle' });
  const controller = useRef<InstanceType<typeof globalThis.AbortController> | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const normalized = normalizeLookupAddress(input);
  const showFormatError = touched && input.trim() !== '' && normalized === null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!normalized) return;
    controller.current?.abort();
    const current = new globalThis.AbortController();
    controller.current = current;
    setView({ kind: 'loading', address: normalized });
    lookupPublicAddress(normalized, current.signal).then(
      result => {
        if (current.signal.aborted) return;
        setView(result.kind === 'ok' ? { kind: 'ready', value: result.value } : result);
      },
      error => {
        if (error?.name !== 'AbortError') setView({ kind: 'unavailable' });
      },
    );
  };

  return (
    <WrfCard
      variant="outlined"
      data-testid="address-lookup"
      header={
        <Typography component="h2" sx={{ fontSize: '1.125rem', fontWeight: 700, m: 0, color: palette.text.primary }}>
          Look up an address
        </Typography>
      }
      sx={{ mb: 3, backgroundColor: palette.background.secondary, borderRadius: `${borderRadiusScale.md}px` }}
    >
      <Box
        component="form"
        role="search"
        aria-label="Look up an address"
        onSubmit={submit}
        noValidate
        sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'flex-start' }, gap: 1.5 }}
      >
        <WrfInput
          label="Address"
          placeholder="0x… or wrf…"
          value={input}
          onChange={event => setInput(event.target.value)}
          onBlur={() => setTouched(true)}
          error={showFormatError}
          errorMessage="Enter 0x or wrf followed by 40 hex characters."
          helperText="Shows the address's balance and what it has earned in total."
          autoComplete="off"
          spellCheck={false}
          slotProps={{ htmlInput: { 'data-testid': 'address-lookup-input', style: { fontFamily: mono } } }}
        />
        <WrfButton
          type="submit"
          variant="primary"
          size="md"
          startIcon={<SearchIcon fontSize="small" />}
          disabled={view.kind === 'loading'}
          sx={{ flexShrink: 0, minHeight: 40 }}
        >
          Look up
        </WrfButton>
      </Box>

      <Box sx={{ mt: 2 }} aria-live="polite">
        {view.kind === 'loading' && (
          <Box role="status" aria-busy="true" aria-label="Looking up the address" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
            <WrfSkeleton variant="rect" height={96} sx={{ borderRadius: `${borderRadiusScale.md}px` }} />
            <WrfSkeleton variant="rect" height={96} sx={{ borderRadius: `${borderRadiusScale.md}px` }} />
          </Box>
        )}

        {view.kind === 'ready' && (
          <Box data-testid="address-lookup-result">
            <Typography
              component="p"
              title={view.value.address}
              sx={{ m: 0, mb: 1.5, fontFamily: mono, fontSize: '0.8125rem', color: palette.text.secondary, overflowWrap: 'anywhere' }}
            >
              {view.value.address}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <Amount label="Balance" units={view.value.balanceUnits} note="Spendable now." testId="address-lookup-balance" />
              <Amount
                label="Earned in total"
                units={view.value.earnedUnits}
                note="Everything the chain has credited to this address, node pay included. Spending does not lower it."
                testId="address-lookup-earned"
              />
            </Box>
            <Typography sx={{ mt: 1.5, fontSize: '0.8125rem', color: palette.text.muted }}>
              As of block {view.value.height.toLocaleString()}. Test coins have no value.
            </Typography>
          </Box>
        )}

        {view.kind === 'off' && (
          <Message title="Unavailable">Address lookups are switched off on this server right now.</Message>
        )}
        {view.kind === 'busy' && (
          <Message title="Busy">Too many lookups right now. Please try again in a minute.</Message>
        )}
        {view.kind === 'unavailable' && (
          <Message title="Unavailable">The testnet node did not answer. Nothing is shown rather than a guessed number.</Message>
        )}
      </Box>
    </WrfCard>
  );
}
