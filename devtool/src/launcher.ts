import {ZapSpeed} from './panel/model';

let code = '';

// Settings that last only while the DevTool is open.
let sessionSettings: SessionSettings = {
  zapSpeed: 'normal',
};

// Create a panel
chrome.devtools.panels.create('Cycle.js', '128.png', 'panel.html', function(extensionPanel) {
  const portToBackground = chrome.runtime.connect({name: 'cyclejs'});
  extensionPanel.onShown.addListener(function (panelWindow) {
    loadGraphSerializerCode();
    if (!panelWindow['postMessageToBackground']) {
      // Setup PANEL=>BACKGROUND communication
      panelWindow['postMessageToBackground'] = function postMessageToBackground(msg: Object) {
        portToBackground.postMessage(msg);
      };

      // Setup PANEL=>GRAPH SERIALIZER communication
      panelWindow['postMessageToGraphSerializer'] =
        function postMessageToGraphSerializer(msg: string) {
          // alert('LAUNCHER is relaying message from panel to graphSerializer: ' + msg);
          if (msg === 'slow' || msg === 'normal' || msg === 'fast') {
            sessionSettings.zapSpeed = msg as ZapSpeed;
          }
          chrome.devtools.inspectedWindow.eval(`window.receivePanelMessage('${msg}');`);
        };

      // Setup BACKGROUND=>PANEL communication
      portToBackground.onMessage.addListener(function (message: BackgroundMessage) {
        // alert('LAUNCHER relaying message from BACKGROUND to PANEL: ' + JSON.stringify(message))
        if (message.type === 'panelData' && typeof panelWindow['postMessage'] === 'function') {
          panelWindow['postMessage']({__fromCyclejsDevTool: true, data: message.data}, '*');
        } else if (message.type === 'tabLoading'
        && message.tabId === chrome.devtools.inspectedWindow.tabId) {
          const settings = `
            window.CyclejsDevToolSettings = ${JSON.stringify(sessionSettings)};
          `;
          chrome.devtools.inspectedWindow.reload({
            injectedScript: `${settings} ${code}` as any as boolean,
          } as chrome.devtools.inspectedWindow.ReloadOptions);
        }
      });
    }

    // alert('LAUNCHER will eval the graphSerializer source code')
    const settings = `
      window.CyclejsDevToolSettings = ${JSON.stringify(sessionSettings)};
    `;
    chrome.devtools.inspectedWindow.eval(settings + loadGraphSerializerCode());
  });
});

export interface SessionSettings {
  zapSpeed: ZapSpeed;
}

function loadGraphSerializerCode() {
  let xhr: XMLHttpRequest;
  if (!code) {
    xhr = new XMLHttpRequest();
    xhr.open('GET', chrome.extension.getURL('/graphSerializer.js'), false);
    xhr.send();
    code = xhr.responseText;
  }
  return code;
}
