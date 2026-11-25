/** @jest-environment jsdom */
/**
 * Forecast skill page (/forecast-skill; owner ruling 2026-11-24). The page formats a vendored copy of the
 * wrfcomp results file. These tests pin the copy to its recorded SHA-256 and check that what the page
 * shows is what the file says.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

afterEach(cleanup);

const { default: PublicForecastSkillPage, ForecastSkillView, skillPercent, yearsOf } = await import('../PublicForecastSkillPage');

const DATA_DIR = join(process.cwd(), 'src/data/forecastSkill');
const bytes = readFileSync(join(DATA_DIR, 'summary.json'));
const summary = JSON.parse(bytes.toString('utf8'));
const source = JSON.parse(readFileSync(join(DATA_DIR, 'summary.source.json'), 'utf8'));
const renderPage = () => render(<MemoryRouter><PublicForecastSkillPage /></MemoryRouter>);

describe('vendored wrfcomp results file', () => {
  it('matches the SHA-256 recorded next to it', () => {
    expect(source.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);
  });

  it('records where it came from: repository, path, full commit and a raw URL at that commit', () => {
    expect(source.repository).toBe('wrfcoin/wrfcomp');
    expect(source.path).toBe(`results/${summary.candidate}/summary.json`);
    expect(source.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(source.url).toBe(`https://raw.githubusercontent.com/${source.repository}/${source.commit}/${source.path}`);
  });
});

describe('PublicForecastSkillPage', () => {
  it('reads nothing over the network', () => {
    globalThis.fetch = jest.fn();
    renderPage();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('states the result per year from the file, the confirmation year last', () => {
    renderPage();
    const years = yearsOf(summary);
    expect(years.map(y => y.year)).toEqual(['2024', '2023']);
    const headline = screen.getByTestId('forecast-skill-headline');
    expect(headline).toHaveTextContent('Passed.');
    expect(headline).toHaveTextContent(summary.candidate);
    for (const y of years) {
      expect(headline).toHaveTextContent(`${summary.years[y.year].quarters_passed} of ${Object.keys(summary.years[y.year].quarters).length} quarters of ${y.year}`);
    }
    expect(headline).toHaveTextContent('4 of 4 quarters of 2024 and in 4 of 4 quarters of 2023, the year held back to confirm it');
  });

  it('lists every quarter with its verdict and the gates met against each reference', () => {
    renderPage();
    for (const [year, record] of Object.entries(summary.years)) {
      const rows = within(screen.getByTestId(`forecast-skill-${year}`)).getAllByTestId('forecast-skill-quarter');
      const keys = Object.keys(record.quarters).sort();
      expect(rows).toHaveLength(keys.length);
      rows.forEach((row, i) => {
        const quarter = record.quarters[keys[i]];
        expect(row).toHaveTextContent(keys[i].replace('-', ' '));
        expect(within(row).getByText(quarter.verdict === 'PASSED' ? 'Passed' : 'Not passed')).toBeInTheDocument();
        // Every skill figure in the row is the file's crpss_vs_baseline as a percent.
        for (const reference of Object.values(quarter.references)) {
          for (const value of Object.values(reference.crpss_vs_baseline)) {
            expect(row).toHaveTextContent(skillPercent(value));
          }
        }
      });
    }
    const q4 = within(screen.getByTestId('forecast-skill-2024')).getAllByTestId('forecast-skill-quarter')[3];
    expect(q4).toHaveTextContent('2024 Q4');
    expect(q4).toHaveTextContent('Passed');
    expect(q4).toHaveTextContent(/against raw NOAA GEFS\s*every gate met/);
    expect(q4).toHaveTextContent(/against climatology\s*every gate met/);
  });

  it('formats skill as a signed percent and shows a dash for a missing figure', () => {
    expect(skillPercent(0.2668455455)).toBe('+26.7%');
    expect(skillPercent(-0.0312)).toBe('-3.1%');
    expect(skillPercent(0)).toBe('0.0%');
    expect(skillPercent(undefined)).toBe('—');
    expect(skillPercent(Number.NaN)).toBe('—');
    // 2023 Q1 temperature against raw NOAA GEFS, straight from the file.
    renderPage();
    const q1 = within(screen.getByTestId('forecast-skill-2023')).getAllByTestId('forecast-skill-quarter')[0];
    expect(q1).toHaveTextContent(skillPercent(summary.years['2023'].quarters['2023-Q1'].references['noaa-gefs'].crpss_vs_baseline.t2m));
  });

  it('says payouts are paper only, what comes next, and links the public repository and the results at the pinned commit', () => {
    renderPage();
    expect(screen.getByTestId('forecast-skill-ledger')).toHaveTextContent('Payouts are a paper ledger only. Nothing pays out.');
    expect(screen.getByTestId('forecast-skill-next')).toHaveTextContent('Next: testing whether citizen weather stations improve this forecast. In progress, no result yet.');
    expect(screen.getByRole('link', { name: 'github.com/wrfcoin/wrfcomp' })).toHaveAttribute('href', 'https://github.com/wrfcoin/wrfcomp');
    expect(screen.getByTestId('forecast-skill-results-link')).toHaveAttribute('href', `https://github.com/wrfcoin/wrfcomp/tree/${source.commit}/results/${summary.candidate}`);
    expect(screen.getByTestId('forecast-skill-source')).toHaveTextContent(source.commit.slice(0, 8));
    expect(screen.getByRole('region', { name: 'The rules' })).toHaveTextContent(`at least ${summary.years['2024'].quarters_required} of 4 quarters`);
  });

  it('describes the method of the candidate in the file: per-station correction plus the airport\'s own reading', () => {
    renderPage();
    expect(summary.candidate).toBe('gefs-station-corrected-v4');
    const lede = screen.getByText(/We tested one candidate/);
    expect(lede).toHaveTextContent('corrected for each station from its recent verified errors');
    expect(lede).toHaveTextContent('For temperature and dewpoint 1 to 6 hours ahead, it also uses the airport station\'s own latest reading');
    expect(lede).not.toHaveTextContent(/citizen/i);
  });

  it('shows a quarter that did not pass and which reference it missed', () => {
    const changed = JSON.parse(JSON.stringify(summary));
    changed.years['2024'].quarters['2024-Q4'].verdict = 'NOT PASSED';
    changed.years['2024'].quarters['2024-Q4'].references['noaa-gefs'].all_gates_passed = false;
    render(<MemoryRouter><ForecastSkillView summary={changed} source={source} /></MemoryRouter>);
    const failed = within(screen.getByTestId('forecast-skill-2024')).getAllByTestId('forecast-skill-quarter')[3];
    expect(failed).toHaveTextContent('2024 Q4');
    expect(failed).toHaveTextContent('Not passed');
    expect(failed).toHaveTextContent(/against raw NOAA GEFS\s*a gate was missed/);
    expect(failed).toHaveTextContent(/against climatology\s*every gate met/);
  });

  it('follows the file, not a fixed claim: a year that is not promoted turns the headline into "Not passed"', () => {
    const changed = JSON.parse(JSON.stringify(summary));
    changed.years['2023'].decision = 'NOT PROMOTED';
    changed.years['2023'].quarters_passed = 2;
    changed.years['2023'].quarters['2023-Q1'].verdict = 'NOT PASSED';
    changed.years['2023'].quarters['2023-Q2'].verdict = 'NOT PASSED';
    render(<MemoryRouter><ForecastSkillView summary={changed} source={source} /></MemoryRouter>);
    const headline = screen.getByTestId('forecast-skill-headline');
    expect(headline).toHaveTextContent('Not passed.');
    expect(headline).toHaveTextContent('2 of 4 quarters of 2023');
    expect(headline).toHaveTextContent('it is not promoted');
  });

  it('shows no result rather than inventing one when the file has no years', () => {
    render(<MemoryRouter><ForecastSkillView summary={{ candidate: 'x' }} source={{}} /></MemoryRouter>);
    expect(screen.getByText('No result is published yet.')).toBeInTheDocument();
    expect(screen.queryByTestId('forecast-skill-quarter')).toBeNull();
  });
});
