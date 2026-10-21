import { formatExactAmount } from '../services/apiClient/amountPrecision';

export type EarnShareCard = {
  heading: string;
  amount?: string | number | bigint | null;
  readings?: number | null;
  streakDays?: number | null;
  walletAddress?: string | null;
};

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

function shortWallet(address?: string | null) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'WRFCoin contributor';
}

/** Render a portable, browser-native PNG without a canvas dependency. */
export async function createEarnShareCard(card: EarnShareCard): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser cannot create a share card.');

  const sky = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  sky.addColorStop(0, '#071D36');
  sky.addColorStop(0.55, '#0B4D72');
  sky.addColorStop(1, '#0C253B');
  context.fillStyle = sky;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  context.fillStyle = 'rgba(120, 219, 255, 0.18)';
  context.beginPath();
  context.arc(1040, 120, 250, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgba(255, 202, 86, 0.22)';
  context.beginPath();
  context.arc(105, 560, 210, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#7DD3FC';
  context.font = '600 26px "JetBrains Mono", monospace';
  context.fillText('WRFCOIN  /  VERIFIED WEATHER', 76, 90);
  context.fillStyle = '#F8FAFC';
  context.font = '800 62px "Space Grotesk", sans-serif';
  context.fillText(card.heading, 76, 190);
  // A withheld amount (null/undefined: e.g. the anonymous operator profile,
  // backend#1222) leaves the line out. It is never drawn as 0.
  if (card.amount != null) {
    context.fillStyle = '#FCD34D';
    context.font = '800 105px "Space Grotesk", sans-serif';
    context.fillText(`${formatExactAmount(card.amount, 4)} WRF`, 76, 324);
  }

  context.fillStyle = 'rgba(248, 250, 252, 0.84)';
  context.font = '500 30px "Inter", sans-serif';
  const readings = Number(card.readings ?? 0).toLocaleString();
  context.fillText(`${readings} verified weather readings`, 80, 408);
  context.fillText(`${Number(card.streakDays ?? 0)}-day contribution streak`, 80, 458);
  context.fillStyle = '#BAE6FD';
  context.font = '600 25px "JetBrains Mono", monospace';
  context.fillText(shortWallet(card.walletAddress), 80, 548);
  context.fillText('wrfcoin.io', 950, 548);

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Could not encode share card.'))), 'image/png');
  });
}

export async function downloadOrShareEarnCard(card: EarnShareCard): Promise<'shared' | 'downloaded'> {
  const blob = await createEarnShareCard(card);
  const file = new File([blob], 'wrfcoin-earned.png', { type: 'image/png' });
  if (navigator.share) {
    const shareData = {
      files: [file],
      title: card.heading,
      text: 'I earned verified WRF for weather data.',
    };
    if (typeof navigator.canShare === 'function' && navigator.canShare(shareData as ShareData)) {
      await navigator.share(shareData);
    }
    else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
      return 'downloaded';
    }
    return 'shared';
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
