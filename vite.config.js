import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled', '@mui/material', '@mui/private-theming'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development'
    ),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // react/react-dom are co-located with MUI since MUI depends on them;
          // putting them in a separate "vendor" chunk produced an empty chunk.
          ui: [
            'react',
            'react-dom',
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
          ],
          charts: ['chart.js', 'react-chartjs-2', 'd3'],
          router: ['react-router'],
          dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          utils: ['axios'],
        },
      },
    },
    target: 'esnext',
    minify: 'terser',
    cssCodeSplit: true,
    sourcemap: false,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'chart.js',
      'react-chartjs-2',
      'd3',
      'axios',
      'bootstrap',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
    ],
    force: true,
    esbuildOptions: {
      target: 'es2020',
    },
  },
  server: {
    port: 5000,
    host: '127.0.0.1',
    strictPort: true,
    fs: {
      allow: ['.'],
    },
    hmr: {
      port: 5000,
    },
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/logs/**',
        '**/cache/**',
      ],
    },
    proxy: {
      '/api/dashboard': {
        target: 'http://0.0.0.0:3001', // Unified API Server handles all dashboard APIs
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace('/api/dashboard', '/api'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[proxy] dashboard error', err);
          });
        },
      },
      '/api/weather-earnings': {
        target: 'http://0.0.0.0:3003', // Weather Earnings Transfer API
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[proxy] weather-earnings error', err);
          });
        },
      },
      '/api/wallet/transfer': {
        target: 'http://0.0.0.0:3003', // Weather Earnings Transfer API
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
      },
      '/api/wallet/send': {
        target: 'http://0.0.0.0:3003', // Weather Earnings Transfer API
        changeOrigin: true,
        secure: false,
        rewrite: path =>
          path.replace('/api/wallet/send', '/api/wallet/transfer'),
      },
      '/api/blockchain': {
        target: 'http://0.0.0.0:3001', // Main API Server - Unified API handles blockchain APIs
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
      },
      '/api/mining': {
        target: 'http://0.0.0.0:3001', // Main API Server - Unified API handles mining APIs
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
      },

      '/api-proxy': {
        target: 'http://0.0.0.0:3001', // Unified API Server has performance dashboard APIs
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace('/api-proxy', '/api'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[proxy] api-proxy error', err);
          });
        },
      },
      '/api/performance': {
        target: 'http://0.0.0.0:3001', // Updated to use Unified API Server
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
      },
      '/api/security': {
        target: 'http://0.0.0.0:3001', // Updated to use Unified API Server
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
      },
      '/api/compliance': {
        target: 'http://0.0.0.0:3001', // Updated to use Unified API Server
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
      },
      '/api/weather': {
        target: 'http://0.0.0.0:3001', // Updated to use Unified API Server
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
      },
      '/api/privacy': {
        target: 'http://0.0.0.0:3001', // Main API Server - Unified API handles privacy APIs
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
      },
      '/api/staking': {
        target: 'http://0.0.0.0:4000', // Main API Server (following port architecture)
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
      },
      '/api/network': {
        target: 'http://0.0.0.0:4000', // Main API Server (following port architecture)
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
      },
      '/api/governance': {
        target: 'http://0.0.0.0:8000', // Governance Server
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[proxy] governance error', err);
          });
        },
      },
      '/api/achievements': {
        target: 'http://0.0.0.0:3001', // Unified API Server (working reliably)
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
      },
      '/api/smart-contracts': {
        target: 'http://0.0.0.0:8080', // Backend Server with smart contracts support
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[proxy] smart-contracts error', err);
          });
        },
      },
      '/api/nft': {
        target: 'http://0.0.0.0:3001', // Unified API Server handles NFT marketplace
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
      },
      '/api/computational': {
        target: 'http://0.0.0.0:8080', // Backend Server handles computational NFTs
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[proxy] computational error', err);
          });
        },
      },
      '/api': {
        target: 'http://0.0.0.0:3001', // Connect to Unified API Server for other endpoints
        changeOrigin: true,
        secure: false,
        rewrite: path => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[proxy] api error', err);
          });
        },
      },
      '/static': {
        target: 'http://0.0.0.0:4002', // Updated to correct secure messaging port
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://0.0.0.0:6000', // WebSocket Server is running on port 6000
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[proxy] websocket error', err);
          });
        },
      },
    },
    allowedHosts: [
      'localhost',
      '127.0.0.1',
    ],
  },
  preview: {
    port: 3000,
    host: '127.0.0.1',
    allowedHosts: [
      'localhost',
      '127.0.0.1',
    ],
  },
});
