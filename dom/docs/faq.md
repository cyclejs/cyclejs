# Frequently Asked Questions

### Why is Cycle DOM based on `virtual-dom` and not React?

First of all, you can use React in Cycle.js. That’s done by using ReactElements instead of virtual-dom VTrees. That’s how [Cycle React Native driver](https://github.com/cyclejs/cycle-react-native) is possible in the first place. When using React in Cycle, the ReactElements and the diff & patch in React are the only parts we need.

We bypass React component classes entirely, the custom event delegator system, and other related things like component state, component props, props types, etc. We use a very small fraction of React.

That’s because Cycle.js has its own convention/system for components, which is quite different and rather incompatible with React’s component system. This is largely why React DOM plus Cycle doesnt make much sense, because we wouldn’t use most of React, but we would still get all of React just to use its ReactElements.

`virtual-dom` on the other hand does not have its own component system neither a custom event delegator. It is much more lightweight than React and much faster in the average case. We use `virtual-dom` because it gives us only what we need, and nothing else.

The only good reason to use React DOM in Cycle would be the ability to use existing React components, such as those provided by libraries. But even then, there are other ways of integrating *whatever* into a Cycle + `virtual-dom` app, such as through `virtual-dom` [Widgets](https://github.com/Matt-Esch/virtual-dom/blob/master/docs/widget.md), which make it possible to wrap e.g. Google Maps or jQuery plugins or anything, even React components. It is also possible to wrap these components in Web Components, which are already fully supported in `virtual-dom` and Cycle DOM, including custom events emitted from Web Components. That is why Web Components were made in the first place: to ease interoperability between frameworks.

A *social* reason to avoid integrating React is to avoid confusion on what principle to follow while building apps. Almost all of React’s best practices or common sense on how to solve problems are bad practices in Cycle, particularly related to everything being a component in React. It is likely people would end up mixing React idiom (`<Foo>` components everywhere) with Cycle idiom (streams and functions over streams) and it would lead to a lot of confusion.

By choosing `virtual-dom`, we don’t even have components a-la React, so the limitation helps people think with what they have instead: reactive streams only. In our use cases in Cycle DOM, `virtual-dom` is faster than React because it doesn’t have all the component baggage, and there still are ways of integrating existing plugins and components through Widgets or Web Components.

Nothing stops people from building an equivalent to Cycle DOM based on React DOM instead of `virtual-dom`, but they would need to keep in mind the abstraction collision between React and Cycle as described above.
