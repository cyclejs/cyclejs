# Cycle History

This is the standard Cycle.js driver for dealing with the History API.

This project is 100% compatible with mjackson/history, most notably used to create React-Router. This allows for a Cycle.js application to be embedded inside of an existing React application and share history instances.

Though this library makes use of the interface that the mjackson/history library provides, any other library can be used which satisfies the interface. Also take note of the ServerHistory object we have made to easily allow for server-side rendering of your Cycle application.

```
npm install @cycle/history
```

# API