import {ZapSpeed} from './panel/model';
import { sessionSettings } from './utils/sessionSettings';

let code = '';

// Create a panel
// alert('LAUNCHER will create panel')
chrome.devtools.panels.create('Cycle.js', '128.png', 'panel.html', function (extensionPanel) {
  // alert('LAUNCHER is currently creating panel')
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
          const cycleJsDevToolSettings = `
            window.CyclejsDevToolSettings = ${JSON.stringify(sessionSettings)};
          `;
          chrome.devtools.inspectedWindow.reload({
            injectedScript: `${cycleJsDevToolSettings} ${code}`,
          });
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
