/**
 * Security regression (audit 2026-08-17): the station/onboarding pages must
 * never again ask a visitor to paste an EXISTING recovery phrase or private
 * key into the site. Training that behavior turns one future XSS or
 * compromised build into direct wallet theft.
 *
 * This is a SOURCE-level guard on purpose: WalletStep (ConnectStationPage) is
 * an internal component that isn't easily DOM-reachable, and a byte-level
 * assertion survives refactors and renames that a rendered-DOM test would
 * miss. Comments are stripped first so the prose that DOCUMENTS the removal
 * cannot satisfy (or trip) the checks.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const pagesDir = join(here, '..');

function codeOf(file: string): string {
  const raw = readFileSync(join(pagesDir, file), 'utf8');
  // Strip block comments then line comments so documentation of the removed
  // flow is not matched as if it were live code.
  return raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const FILES = ['ConnectStationPage.tsx', 'OnboardingPage.tsx'];

// Code signatures that only ever exist to import a pasted reusable secret.
const FORBIDDEN: Array<[string, RegExp]> = [
  ['reconstruct signer from a pasted mnemonic', /Mnemonic\.fromPhrase\s*\(/],
  ['derive HD wallet from a pasted mnemonic', /HDNodeWallet\.fromMnemonic\s*\(/],
  ['build a signer from a pasted private key', /new\s+Wallet\s*\(\s*key/],
  ['fabricate an address from a pasted key', /\.slice\(\s*0\s*,\s*40\s*\)/],
  ['import-existing-wallet handlers', /handleImportWallet|importWalletFromPrivateKey\s*\(/],
  ['secret-entry state setter', /setSecret\s*\(/],
];

describe('no wallet-secret entry in station/onboarding pages', () => {
  for (const file of FILES) {
    const code = codeOf(file);

    // Positive control: the SAFE fresh-generation path must still be present,
    // so a renamed/emptied file cannot make the forbidden checks vacuously pass.
    it(`${file}: still offers safe in-browser wallet generation`, () => {
      expect(code).toMatch(/Wallet\.createRandom\s*\(|generateNewMnemonic\s*\(/);
    });

    for (const [label, pattern] of FORBIDDEN) {
      it(`${file}: does not ${label}`, () => {
        expect(code).not.toMatch(pattern);
      });
    }
  }
});
