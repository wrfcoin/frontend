// Diagnostic only: cold transform latency on the real asserted panel.
module.exports = {
  createTransformer(options) {
    const transformer = require('ts-jest').default.createTransformer(options);
    const originalAsync = transformer.processAsync.bind(transformer);
    const originalSync = transformer.process.bind(transformer);
    const target = filename => filename.endsWith('/Miner/v2/MiningControlsPanel.jsx');
    transformer.processAsync = async function(source, filename, config) {
      if (target(filename)) {
        console.error('[cold-probe] asynchronous transform latency');
        await new Promise(done => setTimeout(done, 6000));
      }
      return originalAsync(source, filename, config);
    };
    transformer.process = function(source, filename, config) {
      if (target(filename)) {
        console.error('[cold-probe] synchronous transform latency');
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 6000);
      }
      return originalSync(source, filename, config);
    };
    return transformer;
  },
};
