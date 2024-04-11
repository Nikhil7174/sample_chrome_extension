// Example of sending a login request from a UI component
function sendLoginRequest(username, password) {
    chrome.runtime.sendMessage({ action: 'login', username: username, password: password });
  }
  
  // Example of sending a logout request from a UI component
  function sendLogoutRequest() {
    chrome.runtime.sendMessage({ action: 'logout' });
  }