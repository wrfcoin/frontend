import { useState } from 'react';
import { WrfCard } from '../DesignSystem';
import { AppIdForm } from '../Wolfram/ReadingUnusualCheck';
import { forgetAppId, getStoredAppId, maskAppId } from '../../services/wolframReadingCheck';

/**
 * Wolfram|Alpha in the (full-studio only) integrations hub. Bring your own key (owner ruling
 * 2026-11-01): the AppID is saved in this browser only, the same place the public proof card's
 * "Is this reading unusual?" check reads it. Nothing is sent to a server from here: there is no
 * shared server key, no settings store and no code execution.
 */
const WolframCard = () => {
  const [appId, setAppId] = useState(() => getStoredAppId());
  return (
    <WrfCard component="section" aria-label="Wolfram|Alpha" header={<h3>Wolfram|Alpha</h3>}>
      <p>
        Use your own Wolfram|Alpha AppID to check whether a station reading is unusual for its place and day.
        The AppID stays in this browser and is used only for your own checks.
      </p>
      {appId ? (
        <p>
          AppID <code>{maskAppId(appId)}</code> is saved on this device.{' '}
          <button type="button" className="ruc-link" onClick={() => { forgetAppId(); setAppId(null); }}>
            Forget it
          </button>
        </p>
      ) : (
        <AppIdForm onSaved={() => setAppId(getStoredAppId())} />
      )}
    </WrfCard>
  );
};

export default WolframCard;
