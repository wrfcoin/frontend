/**
 * Self-hosted web fonts (vendored via @fontsource).
 *
 * These replace the previous `@import url('https://fonts.googleapis.com/...')`
 * rules in src/styles/theme.css and src/pages/NewMinerPage.css. Vendoring keeps
 * the app fully same-origin so the testnet CSP can drop fonts.googleapis.com and
 * fonts.gstatic.com from style-src / font-src.
 *
 * @fontsource ships per-weight CSS with @font-face rules pointing at local woff2
 * files; Vite bundles those font files into dist/ and serves them same-origin.
 *
 * Font families / weights below mirror exactly what the old Google Fonts URLs
 * requested:
 *   theme.css         -> Inter 300-700, JetBrains Mono 400-600
 *   NewMinerPage.css  -> Orbitron 400-900, JetBrains Mono 300-700, Space Grotesk 300-700
 * (JetBrains Mono is unioned to 300-700.)
 */

// Inter — primary UI typeface
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// JetBrains Mono — monospace / data display
import '@fontsource/jetbrains-mono/300.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';

// Orbitron — miner display headings
import '@fontsource/orbitron/400.css';
import '@fontsource/orbitron/500.css';
import '@fontsource/orbitron/600.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/800.css';
import '@fontsource/orbitron/900.css';

// Space Grotesk — miner body / accent
import '@fontsource/space-grotesk/300.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
