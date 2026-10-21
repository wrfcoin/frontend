import React from 'react';
import { Link } from 'react-router-dom';
import { usePublicTestnetStats } from '../hooks/usePublicTestnetStats';
import { getPublicNavEntries } from '../config/publicNavigation';
import { isPublicReadonlyEnabled } from '../config/contractSurfacePolicy';
import './PublicTestnetLandingPage.css';

/**
 * The only page an anonymous public visitor sees. Everything on it has to be
 * true without a signed-in session: no mock figures, no marketing claims about
 * products this testnet does not run, and no links to a destination the owner
 * has not published.
 *
 * Live numbers come from `usePublicTestnetStats`, which reads only the three
 * read-only GET routes the public edge admits (infra#924). A number that
 * cannot be read is rendered as "unavailable" — never as a placeholder.
 */

const UNAVAILABLE = 'unavailable';

function formatHeight(height) {
  return height === null ? UNAVAILABLE : height.toLocaleString();
}

function LatestBlockTime({ isoTime }) {
  if (isoTime === null) {
    return <>{UNAVAILABLE}</>;
  }

  return <time dateTime={isoTime}>{new Date(isoTime).toLocaleString()}</time>;
}

const PublicTestnetLandingPage = () => {
  const stats = usePublicTestnetStats();
  // Same entries as the start menu, filtered by the same route policy.
  const entries = getPublicNavEntries(
    isPublicReadonlyEnabled(import.meta.env?.VITE_PUBLIC_READONLY_PATHS),
  );
  const mainLinks = entries.filter(e => e.group === 'main' && e.path !== '/');
  const policyLinks = entries.filter(e => e.group === 'legal');

  return (
    <main className="public-testnet">
      <header className="public-testnet__hero">
        <div className="public-testnet__intro">
          <p className="public-testnet__eyebrow">WRFCoin</p>
          <h1 className="public-testnet__title">Public weather-data testnet</h1>

          <p className="public-testnet__lede">
            WRFCoin is a public blockchain for weather data: personal weather stations
            contribute observations, forecasts are published against them, and the
            chain rewards contribution it can verify. This is an experimental testnet — it
            exists so those mechanisms can be exercised in the open before anything
            depends on them.
          </p>

          <p className="public-testnet__warning">
            Testnet WRF has no monetary value, the network may reset, and no mainnet migration is promised.
          </p>
        </div>

        <section className="public-testnet__section public-testnet__chain" aria-labelledby="chain-now">
          <h2 id="chain-now">The chain right now</h2>

          {stats.state === 'loading' && (
            <p className="public-testnet__muted" role="status">
              Reading live numbers from the testnet…
            </p>
          )}

          {stats.state === 'unavailable' && (
            <p className="public-testnet__muted" role="status">
              Live numbers unavailable. The public read API did not answer, so
              there is nothing accurate to show here right now.
            </p>
          )}

          {stats.state === 'ready' && (
            <dl className="public-testnet__stats">
              <div className="public-testnet__stat">
                <dt>Block height</dt>
                <dd>{formatHeight(stats.blockHeight)}</dd>
              </div>
              <div className="public-testnet__stat">
                <dt>Latest block</dt>
                <dd>
                  <LatestBlockTime isoTime={stats.latestBlockTime} />
                </dd>
              </div>
              <div className="public-testnet__stat">
                <dt>Coverage zones</dt>
                <dd>{formatHeight(stats.coverageZoneCount)}</dd>
              </div>
            </dl>
          )}
        </section>
      </header>

      <section className="public-testnet__section" aria-labelledby="today">
        <h2 id="today">What you can do today</h2>
        <ul className="public-testnet__list">
          <li>
            Watch the chain. The numbers above come from the testnet's public,
            read-only API — the same three routes anyone can call without an
            account.
          </li>
          <li>
            Read the rules before anything else: the terms, the privacy notice,
            the API terms, and the security policy are linked below.
          </li>
          <li>
            Join in. Open a wallet and connect a weather station using the
            links below; testnet tokens have no value.
          </li>
        </ul>
      </section>

      {mainLinks.length > 0 && (
        <nav className="public-testnet__explore" aria-label="Explore the testnet">
          <h2 className="public-testnet__explore-title">Explore the testnet</h2>
          <div className="public-testnet__cards">
            {mainLinks.map(entry => (
              <Link key={entry.path} to={entry.path} className="public-testnet__card">
                <i className={`bi ${entry.icon} public-testnet__card-icon`} aria-hidden="true" />
                <strong>{entry.name}</strong>
                <span>{entry.description}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      <nav className="public-testnet__links" aria-label="Testnet policies">
        {policyLinks.map(entry => (
          <Link key={entry.path} to={entry.path}>{entry.name}</Link>
        ))}
      </nav>
    </main>
  );
};

export default PublicTestnetLandingPage;
