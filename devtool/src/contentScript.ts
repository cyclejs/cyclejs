window.addEventListener('message', function (evt) {
  // alert('CONTENT SCRIPT got a message')
  const eventData = evt.data;
  if (typeof eventData === 'object'
  && eventData !== null
  && eventData.hasOwnProperty('__fromCyclejsDevTool')
  && eventData.__fromCyclejsDevTool) {
    // alert('CONTENT SCRIPT will send message')
    chrome.runtime.sendMessage(eventData);
  }
});

document.addEventListener('CyclejsDevToolEvent', function (evt: CustomEvent) {
  // alert('CONTENT SCRIPT got CyclejsDevToolEvent, detail: ' + evt.detail);
  // Send to BACKGROUND
  chrome.runtime.sendMessage(evt.detail);
});

// alert('CONTENT SCRIPT started');
