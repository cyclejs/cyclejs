# DevTool

The Cycle.js DevTool is a Chrome DevTools panel for inspecting the dataflow graph of a Cycle.js application. It visualizes the streams that connect your sources and sinks, then animates events as they move through the graph.

This is useful when an app has many streams or nested components and reading the code alone is not enough to understand why a sink receives a value.

![Cycle.js DevTool graph](img/devtool.png)

## Requirements

The DevTool observes xstream debug listeners exposed by Cycle.js packages. Your app should use:

- `xstream` v6.1.x or higher
- `@cycle/run` v3.1.x or higher
- `@cycle/dom` v12.2.x or higher when the app uses the DOM driver
- `@cycle/http` v10.2.x or higher when the app uses the HTTP driver

The graph serializer expects sink streams to be xstream streams. If an inspected app is using another stream library through `@cycle/rxjs-run` or `@cycle/most-run`, the DevTool may not be able to display the graph.

## Install from Chrome Web Store

Install the [Cycle.js Chrome extension](https://chrome.google.com/webstore/detail/cyclejs/dfgplfmhhmdekalbpejekgfegkonjpfp), open the app you want to inspect, then open Chrome DevTools. A **Cycle.js** panel appears next to the other DevTools panels.

If the panel is blank while inspecting an app loaded from `file://`, open `chrome://extensions/`, find the Cycle.js extension, and enable **Allow access to file URLs**.

## Build from source

You can also build the extension from this repository:

```bash
cd devtool
npm run dist
```

This compiles the extension into `devtool/dist` and creates `cyclejs-devtool.zip`. To load the unpacked build in Chrome:

1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select the `devtool/dist` directory.

## Inspect an app

After opening the **Cycle.js** DevTools panel, reload the inspected page so the extension can inject its graph serializer before the app starts.

The graph shows sources and sinks as named boundary nodes. Operators and intermediate streams appear between them, so you can follow how values move from effects into the app and back out to drivers.

Use the speed controls in the panel to slow down or speed up event animations when the app emits many values.

## Troubleshooting

If no graph appears:

- Confirm the app uses supported versions of `xstream`, `@cycle/run`, and the drivers listed above.
- Reload the inspected page after opening the DevTools panel.
- Check that Chrome is allowed to access `file://` URLs when inspecting a local static page.
- Make sure the app is not running with a production build that strips the debug hooks the DevTool relies on.

If the graph appears but events do not animate, interact with the app after the panel is open. The DevTool only animates events it observes while connected to the inspected page.
