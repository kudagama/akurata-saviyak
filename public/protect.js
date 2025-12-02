// Code Protection Script
(function() {
  'use strict';
  
  // Disable right-click context menu
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });

  // Disable text selection (commented out - uncomment if you want to disable text selection)
  // Note: This can be annoying for legitimate users who want to copy text
  // document.addEventListener('selectstart', function(e) {
  //   e.preventDefault();
  //   return false;
  // });

  // Disable drag
  document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
  });

  // Disable keyboard shortcuts for developer tools
  document.addEventListener('keydown', function(e) {
    // Disable F12
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+Shift+I (Chrome DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+Shift+J (Chrome Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+Shift+C (Chrome Inspect Element)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+S (Save Page)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+P (Print - can be annoying, but helps protect)
    // Comment out if users need to print
    // if (e.ctrlKey && e.key === 'p') {
    //   e.preventDefault();
    //   return false;
    // }
  });

  // Detect developer tools opening
  let devtools = {
    open: false,
    orientation: null
  };

  const threshold = 160;
  
  setInterval(function() {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        // Clear console
        console.clear();
        // Show warning
        console.log('%c⚠️ WARNING ⚠️', 'color: red; font-size: 50px; font-weight: bold;');
        console.log('%cThis is a browser feature intended for developers. Do not enter any code here.', 'color: red; font-size: 20px;');
        console.log('%cIf someone told you to copy-paste something here, it is a scam and will give them access to your account.', 'color: red; font-size: 16px;');
        // Optionally redirect or show alert
        // window.location.href = 'about:blank';
      }
    } else {
      devtools.open = false;
    }
  }, 500);

  // Disable console methods
  const noop = function() {};
  const methods = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml', 
                   'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd'];
  
  methods.forEach(function(method) {
    if (console[method]) {
      console[method] = noop;
    }
  });

  // Disable common debugging functions
  window.addEventListener('beforeunload', function(e) {
    // Clear sensitive data if needed
  });

})();

