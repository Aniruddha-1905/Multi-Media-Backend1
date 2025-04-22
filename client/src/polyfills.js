/**
 * Comprehensive polyfills for browser environment
 * This file provides Node.js compatibility for browser-based applications
 */

// Polyfill for process in browser environment
if (typeof window !== 'undefined') {
  // Create or update the process object
  if (typeof window.process === 'undefined') {
    window.process = {};
  }

  // Ensure process.env exists
  if (typeof window.process.env === 'undefined') {
    window.process.env = { DEBUG: undefined };
  }

  // Implement nextTick using setTimeout
  if (typeof window.process.nextTick === 'undefined') {
    window.process.nextTick = function(callback, ...args) {
      setTimeout(() => callback(...args), 0);
    };
  }

  // Add other process properties
  window.process.browser = true;
  window.process.title = 'browser';
  window.process.version = '';
  window.process.versions = { node: '' };
  window.process.platform = 'browser';

  // Add process.hrtime if missing
  if (typeof window.process.hrtime === 'undefined') {
    window.process.hrtime = function(previousTimestamp) {
      const clocktime = performance.now() * 1e-3;
      let seconds = Math.floor(clocktime);
      let nanoseconds = Math.floor((clocktime % 1) * 1e9);

      if (previousTimestamp) {
        seconds = seconds - previousTimestamp[0];
        nanoseconds = nanoseconds - previousTimestamp[1];

        if (nanoseconds < 0) {
          seconds--;
          nanoseconds += 1e9;
        }
      }
      return [seconds, nanoseconds];
    };
  }

  // Add process.cwd if missing
  if (typeof window.process.cwd === 'undefined') {
    window.process.cwd = function() {
      return '/';
    };
  }

  console.log('Process polyfill loaded successfully');
}

// Note: If Buffer is needed, install the 'buffer' package and uncomment:
// if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
//   window.Buffer = require('buffer/').Buffer;
//   console.log('Buffer polyfill loaded');
// }

// Add other browser polyfills here if needed
