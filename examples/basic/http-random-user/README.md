# Cycle.js HTTP random user example

This example fetches and displays a random user from JSONPlaceholder.

This is good for:

- Sending HTTP requests from a Cycle.js app
- Categorizing requests so the matching responses can be selected
- Adding basic TypeScript types to DOM and HTTP sources

## How it works

Clicking the button creates a GET request object with the `users` category.
The HTTP driver receives that request and returns response streams. The app
selects the `users` responses, flattens the response stream, reads the response
body, and renders the user's name, email, and website.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/basic/http-random-user/index.html`
