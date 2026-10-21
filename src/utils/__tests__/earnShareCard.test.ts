/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { createEarnShareCard, downloadOrShareEarnCard } from '../earnShareCard';

function makeCanvas() {
  const context = {
    fillStyle: '',
    font: '',
    // Mirrors exactly the CanvasRenderingContext2D surface earnShareCard.ts
    // uses: arc, beginPath, createLinearGradient, fill, fillRect, fillStyle,
    // fillText, font. createLinearGradient must return an object exposing
    // addColorStop -- the gradient is what receives it, not the context.
    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    fill: jest.fn(),
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fillText: jest.fn(),
  } as unknown as CanvasRenderingContext2D;

  return {
    width: 0,
    height: 0,
    getContext: jest.fn(() => context),
    toBlob: jest.fn((cb: (blob: Blob | null) => void) => cb(new Blob(['bytes']))),
  };
}

describe('downloadOrShareEarnCard', () => {
  const originalCreateElement = document.createElement;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    document.createElement = jest.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return makeCanvas() as unknown as HTMLCanvasElement;
      }

      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: jest.fn(),
        } as unknown as HTMLAnchorElement;
      }

      return originalCreateElement.call(document, tagName);
    }) as typeof document.createElement;

    URL.createObjectURL = jest.fn(() => 'blob:test:wrfcoin-earned');
    URL.revokeObjectURL = jest.fn();

    Object.defineProperty(global.navigator, 'share', {
      configurable: true,
      writable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.createElement = originalCreateElement;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    delete (global.navigator as Partial<Navigator>).canShare;
  });

  it('uses file share only when canShare is present and returns true', async () => {
    (global.navigator as Navigator & { canShare?: (data: ShareData) => boolean; share: jest.Mock }).canShare = jest.fn(() => true);

    const card = { heading: 'Shareable WRF', amount: 12.5 };
    const action = await downloadOrShareEarnCard(card);

    expect(action).toBe('shared');
    expect((global.navigator.share as jest.Mock)).toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('falls back to download when file-sharing capability is unavailable', async () => {
    const anchor = { href: '', download: '', click: jest.fn() } as unknown as HTMLAnchorElement;
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return makeCanvas() as unknown as HTMLCanvasElement;
      }
      if (tagName === 'a') {
        return anchor;
      }
      return originalCreateElement.call(document, tagName);
    });

    delete (global.navigator as Partial<Navigator>).canShare;
    const action = await downloadOrShareEarnCard({ heading: 'Shareable WRF', amount: 12.5 });

    expect(action).toBe('downloaded');
    expect(global.navigator.share).not.toHaveBeenCalled();
    expect(anchor.click).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  // backend#1222: a withheld amount leaves the amount line out, never "0 WRF".
  describe('amount line', () => {
    async function drawnText(amount: string | number | null | undefined): Promise<string[]> {
      const canvas = makeCanvas();
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) =>
        tagName === 'canvas'
          ? (canvas as unknown as HTMLCanvasElement)
          : originalCreateElement.call(document, tagName),
      );
      await createEarnShareCard({ heading: 'Storm Node', amount });
      const context = canvas.getContext() as unknown as { fillText: jest.Mock };
      return context.fillText.mock.calls.map(call => String(call[0]));
    }

    it.each([null, undefined])('omits the amount line for %p', async amount => {
      const text = await drawnText(amount);
      expect(text.some(line => line.endsWith(' WRF'))).toBe(false);
      expect(text).toContain('Storm Node');
    });

    it('draws a real zero', async () => {
      const text = await drawnText('0');
      expect(text.filter(line => line.endsWith(' WRF'))).toHaveLength(1);
    });
  });
});
