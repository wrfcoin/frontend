// Minimal @mui/material/styles stub.
// Prevents the 230-file MUI+emotion dependency chain from being loaded as ESM VM modules.
// Must use `exports.X = ...` assignments (not module.exports = {...}) so cjs-module-lexer
// can statically detect all named exports — required for jest ESM named-import resolution.
const React = require('react');

// Enough shape to keep component code that calls theme.palette.* etc. alive.
const minimalTheme = {
  palette: {
    common: { white: '#fff', black: '#000' },
    primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0', contrastText: '#fff' },
    secondary: { main: '#9c27b0', light: '#ba68c8', dark: '#7b1fa2', contrastText: '#fff' },
    error: { main: '#d32f2f', contrastText: '#fff' },
    warning: { main: '#ed6c02', contrastText: '#fff' },
    info: { main: '#0288d1', contrastText: '#fff' },
    success: { main: '#2e7d32', contrastText: '#fff' },
    text: { primary: 'rgba(0,0,0,0.87)', secondary: 'rgba(0,0,0,0.6)', disabled: 'rgba(0,0,0,0.38)' },
    background: { default: '#fff', paper: '#fff' },
    action: { hover: 'rgba(0,0,0,0.04)', selected: 'rgba(0,0,0,0.08)', disabledBackground: 'rgba(0,0,0,0.12)' },
    divider: 'rgba(0,0,0,0.12)',
    mode: 'light',
  },
  typography: {
    fontSize: 14,
    fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
    h4: { fontSize: '2.125rem', fontWeight: 400 },
    h5: { fontSize: '1.5rem', fontWeight: 400 },
    h6: { fontSize: '1.25rem', fontWeight: 500 },
    subtitle1: { fontSize: '1rem', fontWeight: 400 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500 },
    body1: { fontSize: '1rem', fontWeight: 400 },
    body2: { fontSize: '0.875rem', fontWeight: 400 },
    button: { fontSize: '0.875rem', fontWeight: 500 },
    caption: { fontSize: '0.75rem', fontWeight: 400 },
  },
  spacing: function (factor) { return typeof factor === 'number' ? factor * 8 + 'px' : '8px'; },
  zIndex: { mobileStepper: 1000, fab: 1050, speedDial: 1050, appBar: 1100, drawer: 1200, modal: 1300, snackbar: 1400, tooltip: 1500 },
  shape: { borderRadius: 4 },
  shadows: Array(25).fill('none'),
  transitions: {
    create: function () { return ''; },
    easing: { easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    duration: { shortest: 150, shorter: 200, short: 250, standard: 300, complex: 375, enteringScreen: 225, leavingScreen: 195 },
  },
  components: {},
  breakpoints: {
    up: function () { return '@media (min-width:0px)'; },
    down: function () { return '@media (max-width:600px)'; },
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  direction: 'ltr',
  mixins: { toolbar: {} },
};

// ThemeProvider wraps children; real MUI components fall back to default theme without context.
exports.ThemeProvider = function ThemeProvider(props) {
  return React.createElement(React.Fragment, null, props.children);
};

exports.createTheme = function createTheme() {
  return minimalTheme;
};

exports.useTheme = function useTheme() {
  return minimalTheme;
};

exports.useColorScheme = function useColorScheme() {
  return { mode: 'light', setMode: function () {} };
};

exports.responsiveFontSizes = function responsiveFontSizes(theme) {
  return theme || minimalTheme;
};

exports.styled = function styled() {
  return function styledComponent(props) {
    return React.createElement('div', props);
  };
};

exports.alpha = function alpha(color) { return color; };
exports.darken = function darken(color) { return color; };
exports.lighten = function lighten(color) { return color; };
