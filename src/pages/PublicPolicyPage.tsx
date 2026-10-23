import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './PublicPolicyPage.css';

type PolicySection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type Policy = {
  title: string;
  summary: string;
  sections: PolicySection[];
};

const effectiveDate = 'August 16, 2026';

const policies: Record<string, Policy> = {
  '/terms': {
    title: 'Testnet Terms of Use',
    summary: 'WRFCoin is an experimental public testnet. These terms describe the risks and acceptable-use rules for this test environment.',
    sections: [
      {
        heading: 'Testnet only',
        bullets: [
          'Testnet tokens and displayed rewards have no promised monetary value and are not an investment, security, deposit, or payment product.',
          'The network, accounts, balances, rewards, APIs, and stored data may be changed, reset, interrupted, or removed without notice.',
          'Nothing on this site is financial, legal, tax, or investment advice.',
        ],
      },
      {
        heading: 'Your responsibility',
        bullets: [
          'Use a test-only wallet. Never submit an existing seed phrase, private key, production credential, or funds of real-world value.',
          'Review wallet messages before signing. A WRFCoin login message should identify the WRFCoin testnet domain, wallet address, URI, chain ID, nonce, and expiry.',
          'You are responsible for your device, wallet, station credentials, backups, and compliance with laws that apply to you.',
        ],
      },
      {
        heading: 'Acceptable use',
        bullets: [
          'Do not disrupt the service, evade rate limits, probe systems outside the published security policy, access another person’s data, or use the testnet for unlawful activity.',
          'Do not upload personal, confidential, regulated, or safety-critical data unless the test specifically requires it and you understand that blockchain records may be permanent.',
          'Automated use must follow the API Terms and operator instructions.',
        ],
      },
      {
        heading: 'No warranty or guaranteed reward',
        paragraphs: [
          'The software and service are provided on an “as is” and “as available” basis for testing. To the maximum extent allowed by law, WRFCoin contributors disclaim warranties and do not guarantee availability, data accuracy, token balances, station acceptance, reward settlement, or fitness for any purpose.',
        ],
      },
      {
        heading: 'Changes and suspension',
        paragraphs: [
          'Access may be limited or suspended to protect the network or other testers. Material revisions will be reflected by updating the effective date on this page. Open-source components remain subject to their own licenses.',
        ],
      },
    ],
  },
  '/privacy': {
    title: 'Testnet Privacy Notice',
    summary: 'This notice describes the categories of data the current WRFCoin testnet may process. It does not claim certification under any privacy framework.',
    sections: [
      {
        heading: 'Data the testnet may process',
        bullets: [
          'Basic request and security metadata, such as IP address, request time, requested path, user agent, response status, and rate-limit signals, may appear in edge or server logs.',
          'Wallet authentication uses a public wallet address, a short-lived challenge and signature, and session tokens. The site should never request an existing seed phrase or private key.',
          'Station participation may process a station identifier, owner wallet address, approximate or precise location, weather observations, hardware details, and provider credentials needed to connect the station.',
          'Public blockchain data, including addresses, transactions, contributions, approvals, and rewards, may be visible permanently and cannot be deleted like an ordinary account record.',
          'The browser stores interface preferences and limited workflow/session state locally on your device. You can clear it with your browser controls.',
        ],
      },
      {
        heading: 'Why it is used',
        bullets: [
          'Operate, secure, debug, and improve the public testnet.',
          'Authenticate wallets, register stations, ingest weather observations, settle testnet rewards, enforce rate limits, and investigate abuse.',
          'Maintain network and contribution records that other nodes can verify.',
        ],
      },
      {
        heading: 'Service providers and public records',
        paragraphs: [
          'Infrastructure providers, including the public redirect, encrypted ingress, hosting, and network services, may process request metadata to deliver and protect the site. Blockchain records are shared with testnet nodes and anyone who reads the public chain. The project does not currently operate an advertising-data sale program.',
        ],
      },
      {
        heading: 'Retention and choices',
        paragraphs: [
          'Retention depends on the data: browser storage lasts until cleared, operational logs follow operator needs and capacity, and blockchain records may be permanent. Because this is an early testnet, do not submit data that requires a guaranteed deletion schedule. You may stop participating, disconnect a station provider, clear browser storage, and request help through the project repository without posting sensitive details publicly.',
        ],
      },
      {
        heading: 'Children and changes',
        paragraphs: [
          'The testnet is not directed to children under 18. This notice may change as the architecture and data practices mature; material revisions will update the effective date.',
        ],
      },
    ],
  },
  '/api-terms': {
    title: 'Public API Terms',
    summary: 'The public API surface is deliberately narrow and is provided for testnet participation and verification.',
    sections: [
      {
        heading: 'Permitted use',
        bullets: [
          'Use only documented public endpoints and normal browser or testnet-client request patterns.',
          'Respect response status codes, authentication requirements, cache guidance, rate limits, and retry delays.',
          'Treat all responses as experimental and independently validate any result used in your software.',
        ],
      },
      {
        heading: 'Prohibited use',
        bullets: [
          'Do not bypass the public edge allowlist, impersonate another client, forge forwarding headers, evade per-client limits, scrape aggressively, or interfere with availability.',
          'Do not use credentials, wallet tokens, station data, or identifiers belonging to another person.',
          'Security research must follow the published Security Policy.',
        ],
      },
      {
        heading: 'Availability and changes',
        paragraphs: [
          'Endpoints, schemas, limits, and availability may change or be withdrawn without notice. There is no service-level agreement. Access may be throttled or blocked to protect the testnet.',
        ],
      },
    ],
  },
  '/security': {
    title: 'Security & Vulnerability Disclosure',
    summary: 'Responsible reports are welcome. Protect users and the live testnet while investigating.',
    sections: [
      {
        heading: 'How to report',
        paragraphs: [
          'Report privately by email to security@wrfcoin.com. Do not include exploit details, secrets, personal data, wallet material, station credentials, or a working attack in any public channel such as a GitHub issue.',
        ],
      },
      {
        heading: 'Good-faith testing rules',
        bullets: [
          'Use your own accounts, wallets, stations, and data. Stop immediately if you encounter another person’s data.',
          'Do not perform denial-of-service, social engineering, physical attacks, destructive actions, persistence, data extraction, or tests that could affect consensus or testnet availability.',
          'Prefer local source, isolated test environments, and the smallest proof needed. Do not test against third-party services that are outside WRFCoin’s control.',
          'Allow reasonable time for investigation and remediation before any disclosure. No bounty or payment is promised.',
        ],
      },
      {
        heading: 'Scope',
        paragraphs: [
          'This policy covers the WRFCoin public testnet site and WRFCoin-owned source repositories. Redirect, ingress, DNS, hosting, wallet, weather-provider, and other third-party services are governed by their own policies.',
        ],
      },
    ],
  },
};

export default function PublicPolicyPage() {
  const { pathname } = useLocation();
  const policy = policies[pathname] ?? policies['/terms'];

  return (
    <article className="public-policy" aria-labelledby="policy-title">
      <p className="public-policy__eyebrow">WRFCoin public testnet</p>
      <h1 id="policy-title">{policy.title}</h1>
      <p className="public-policy__effective">Effective {effectiveDate}</p>
      <p className="public-policy__summary">{policy.summary}</p>

      {policy.sections.map(section => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          {section.bullets && (
            <ul>
              {section.bullets.map(item => <li key={item}>{item}</li>)}
            </ul>
          )}
        </section>
      ))}

      {pathname === '/security' && (
        <p>
          <a href="mailto:security@wrfcoin.com">
            Email the security team privately
          </a>
        </p>
      )}

      <nav className="public-policy__links" aria-label="Public policies">
        <Link to="/terms">Terms</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/api-terms">API Terms</Link>
        <Link to="/security">Security</Link>
      </nav>
    </article>
  );
}
