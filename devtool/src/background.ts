let portToLauncher: chrome.runtime.Port | null = null;

// Setup BACKGROUND<=>LAUNCHER (wrapping a panel) communication
chrome.runtime.onConnect.addListener(function(port) {
  // inspectedTabs[port.sender.id] = port;
  portToLauncher = port;

  const devToolsListener = function(rawMessage: any, sender: chrome.runtime.Port) {
    // const message = JSON.parse(rawMessage);
    // alert('BACKGROUND on this port message: ' + rawMessage)
    // OPTIONAL: communicate to the USER PAGE through an injected script
  };

  // alert('BACKGROUND connecting to a launcher port');
  port.onMessage.addListener(devToolsListener);

  port.onDisconnect.addListener(function() {
    port.onMessage.removeListener(devToolsListener);
    // Reset reload counter to prevent stale state when launcher disconnects
    reloaded = 0;
  });
});

interface BackgroundMessage {
  type: 'panelData' | 'tabLoading' | 'cycleAppDetected' | 'cycleAppError';
  data?: Object;
  tabId?: number;
  appInfo?: {
    framework: string;
    runner: string;
    version?: string;
    hasCycleGlobal: boolean;
  };
}

// From the CONTENT SCRIPT
chrome.runtime.onMessage.addListener(function (message, sender) {
  // Forward general messages to launcher, but exclude detection messages
  // to avoid interfering with the dedicated detection pipeline.
  if (portToLauncher && message.type !== 'cycleAppDetected' && message.type !== 'cycleAppError') {
    portToLauncher.postMessage({type: 'panelData', data: message} as BackgroundMessage);
  }
});

// Necessary to avoid the background detecting a reload triggered from the
// launcher and then causing the launcher to reload, and repeating this process
// in an infinite cycle, we need to keep track of even/odd instances of reload.
let reloaded = 0; // number of times reloaded

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // alert('BACKGROUND a tab was updated');
  if (portToLauncher && changeInfo.status === 'loading') {
    if (reloaded % 2 === 0) {
      portToLauncher.postMessage({ type: 'tabLoading', tabId } as BackgroundMessage);
    }
    reloaded += 1;
  }
});

// NEW: Cycle.js detection logic
// Inject content script to detect Cycle.js apps and set up execution hooks
function detectCycleApp(tabId: number): void {
  // Validate tabId and avoid injecting into non-http/https/file URLs
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.warn(`Failed to get tab ${tabId}:`, chrome.runtime.lastError);
      return;
    }
    if (!tab || !tab.url) return;

    const url = tab.url;
    // Only inject into standard web pages
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      return;
    }

    chrome.tabs.executeScript(tabId, {
      file: 'detect-cyclejs.js'
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.warn('Failed to inject detection script:', chrome.runtime.lastError);
        return;
      }
      // The detection script will send a message back via onMessage
      // when it detects Cycle.js or throws an error
    });
  });
}

// NEW: Listen for detection results from content scripts
chrome.runtime.onMessage.addListener(function(message: any, sender: chrome.runtime.MessageSender) => {
  if (message.type === 'cycleAppDetected' && portToLauncher) {
    // Forward detection info to launcher
    portToLauncher.postMessage({
      type: 'cycleAppDetected',
      tabId: sender.tab?.id,
      appInfo: message.appInfo
    } as BackgroundMessage);
  } else if (message.type === 'cycleAppError' && portToLauncher) {
    portToLauncher.postMessage({
      type: 'cycleAppError',
      tabId: sender.tab?.id,
      data: message.error
    } as BackgroundMessage);
  }
});

// NEW: Inject detection script when a tab completes loading
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && 
      (tab.url.startsWith('http://') || tab.url.startsWith('https://') || tab.url.startsWith('file://'))) {
    detectCycleApp(tabId);
  }
});

// NEW: Re-inject when navigation occurs (for SPAs)
chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
  detectCycleApp(addedTabId);
});