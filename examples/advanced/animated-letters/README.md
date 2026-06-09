# Cycle.js Animated Letters example

This example lets you press letter keys to add and remove animated letters.

This is good for:

- Reading non-DOM events through a custom source
- Comparing consecutive states with `pairwise`
- Expanding state changes into animation frames with the Time driver

## How it works

Keyboard events are converted into single-letter actions. The model keeps a
sorted list of active letters, and the animation layer compares the previous
and next letter lists to find added and removed letters. Each change is expanded
into short timed frame streams, then folded into animated letter sizes for
rendering.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/advanced/animated-letters/index.html`
