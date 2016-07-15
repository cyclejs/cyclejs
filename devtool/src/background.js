var portToLauncher = null;

// Setup BACKGROUND<=>LAUNCHER (wrapping a panel) communication
chrome.runtime.onConnect.addListener(function(port) {
  // alert('BACKGROUND setting up communication with LAUNCHER');
  // inspectedTabs[port.sender.id] = port;
  portToLauncher = port;
  var devToolsListener = function(rawMessage, sender, sendResponse) {
    var message = JSON.parse(rawMessage);
    // alert('BACKGROUND on this port message: ' + rawMessage)
    // OPTIONAL: communicate to the USER PAGE through an injected script
  }
  // alert('BACKGROUND connecting to a launcher port')
  port.onMessage.addListener(devToolsListener);

  port.onDisconnect.addListener(function() {
    port.onMessage.removeListener(devToolsListener);
  });
});

// From the CONTENT SCRIPT
chrome.runtime.onMessage.addListener(function (message, sender) {
  // alert('BACKGROUND got general message ' + JSON.stringify(message))
  if (portToLauncher) {
    // To the LAUNCHER port
    portToLauncher.postMessage({type: 'panelData', data: message});
  }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // alert('BACKGROUND a tab was updated');
  if (portToLauncher) {
    // To the LAUNCHER
    portToLauncher.postMessage({type: 'tabUpdated', tabId: tabId});
  }
});
