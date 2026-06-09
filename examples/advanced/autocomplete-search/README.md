# Autocomplete search example

Equivalent to a ClojureScript example by @swannodette: http://swannodette.github.io/2013/08/17/comparative/

This example searches a local list of suggestions as the user types.

This is good for:

- Combining keyboard input with derived suggestion state
- Managing focused suggestions separately from the query text
- Running the app with hot reloading while preserving state

## How it works

The app keeps the search query, suggestion matches, and selected suggestion in
streams. DOM input events update the query, keyboard events move the selection,
and the view renders both the input field and the filtered suggestion list.

## Usage

Run `npm run live` to use this app with hot reloading enabled: change the source
code and save the file to see near instant updates to the app, without resetting
the app's state.
