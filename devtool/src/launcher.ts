// Create a panel
chrome.devtools.panels.create('Cycle.js', '128.png', 'panel.html', function(extensionPanel) {
  var portToBackground = chrome.runtime.connect({name: 'cyclejs'});
  extensionPanel.onShown.addListener(function (panelWindow) {
    loadGraphSerializerCode();
    if (!panelWindow['postMessageToBackground']) {
      // Setup PANEL=>BACKGROUND communication
      panelWindow['postMessageToBackground'] = function postMessageToBackground(msg: Object) {
        portToBackground.postMessage(msg);
      };
      // Setup BACKGROUND=>PANEL communication
      portToBackground.onMessage.addListener(function (message: BackgroundMessage) {
        // alert('LAUNCHER relaying message from BACKGROUND to PANEL, message: ' + JSON.stringify(message))
        if (message.type === 'panelData' && typeof panelWindow['postMessage'] === 'function') {
          panelWindow['postMessage']({__fromCyclejsDevTool: true, data: message.data}, '*');
        } else if (message.type === 'tabLoading'
        && message.tabId === chrome.devtools.inspectedWindow.tabId) {
          chrome.devtools.inspectedWindow.reload(
            { injectedScript: code as any as boolean } as chrome.devtools.inspectedWindow.ReloadOptions
          );
        }
      });
    }
    // alert('LAUNCHER will eval the graphSerializer source code')
    chrome.devtools.inspectedWindow.eval(loadGraphSerializerCode());
  });
});

let code: string = '';

function loadGraphSerializerCode() {
  let xhr: XMLHttpRequest;
  if (!code) {
    xhr = new XMLHttpRequest();
    xhr.open("GET", chrome.extension.getURL('/graphSerializer.js'), false);
    xhr.send();
    code = xhr.responseText;
  }
  return code;
}
