// Stub for individual @mui/icons-material/<Name> paths.
// module.exports is a function so that jest ESM loadCjsAsEsm sets
// `default = module.exports = MockIcon` (a function), not an exports object.
// Named imports from barrel imports (@mui/icons-material) are handled by muiMock.cjs.
const React = require('react');
function MockIcon(props) {
  return React.createElement('span', { 'data-mui-icon': 'mock' });
}
module.exports = MockIcon;
