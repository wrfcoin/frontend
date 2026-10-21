/**
 * The light theme's brand accents are drawn as text and outlines on the page and on paper, and as the
 * fill behind white button text; each pairing must hold 4.5:1. (The created MUI theme is stubbed under
 * Jest, so this checks the accent constants the theme is built from.)
 */
import { describe, it, expect } from '@jest/globals';
import { lightAccents } from '../index';
import { contrastRatio, hexToRgb } from '../contrast';
import { bgPrimaryLight, bgSecondaryLight, textPrimaryLight } from '../tokens';

describe('light theme accents', () => {
  const page = hexToRgb(bgPrimaryLight);
  const paper = hexToRgb(bgSecondaryLight);
  const white = hexToRgb('#FFFFFF');
  it('keeps primary and secondary legible as text and under white text', () => {
    for (const { main } of [lightAccents.primary, lightAccents.secondary]) {
      const rgb = hexToRgb(main);
      expect(contrastRatio(rgb, page)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(rgb, paper)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(white, rgb)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('keeps body text on the page surface', () => {
    expect(contrastRatio(hexToRgb(textPrimaryLight), page)).toBeGreaterThanOrEqual(7);
  });
});
