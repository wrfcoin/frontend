/** Passkey creation errors, shared by the passkey page and the onboarding page (which creates passkeys first). */
export const UNSUPPORTED_MESSAGE = 'This browser or device cannot create a passkey that stays on the device. Try a recent Chrome, Safari or Edge with a screen lock enabled.';
export const SECURITY_KEY_UNSUPPORTED_MESSAGE = 'No passkey was created on a security key. Check that the key is plugged in (or held to the phone) and has a PIN set, then try again in a recent Chrome, Safari, Edge or Firefox.';

/** "Use an existing passkey": every failure says nothing was saved, because nothing was. */
export const EXISTING_CANCELLED_MESSAGE = 'No wallet was opened: the prompt was cancelled, or this browser found no WRFCoin passkey for this site. Nothing was saved.';
export const EXISTING_DIFFERENT_MESSAGE = 'Those were two different passkeys, so no wallet was opened. Nothing was saved. Try again and pick the same passkey both times.';
export const EXISTING_FAILED_MESSAGE = 'This passkey could not be opened as a wallet: its signatures did not lead to one public key. Nothing was saved.';
