# Cycle.js Examples

Browse and learn from examples of small Cycle.js apps using Core, DOM Driver, HTML Driver, HTTP Driver, JSONP Driver, and others.

## Usage

1.  Open the directory of an example in your terminal.
2.  Type `npm start`
3.  Open the `index.html` of that example in your browser, with the full path, e.g. `file:///Users/myself/cycle-examples/jsx-seconds-elapsed/index.html`

## Study guide

Start with the examples under the basic folder in this order:

1. [hello-world](./basic/hello-world/)
2. [checkbox](./basic/checkbox/)
3. [counter](./basic/counter/)
4. [http-random-user](./basic/http-random-user/)
5. [bmi-naive](./basic/bmi-naive/)

There're corresponding examples between difficulty levels such as [bmi-naive](./basic/bmi-naive/) with [bmi-TypeScript](./intermediate/bmi-typescript/) or [animation](./intermediate/animation/) with [animated-letters](./advanced/animated-letters/).


## Methods and libraries used by examples

#### Basic

**[bmi-naive](./basic/bmi-naive/)** Buggy input field as result of reuse as component that will sync with sister instances for lack of isolation, written in RxJS as opposed to xstream.

**[checkbox](./basic/checkbox/)** What would be considered a controlled input in react. Method of input handling that permits change from both the user and program.

**[counter](./basic/counter/)** Counts up or down on respective button press, state/model accumulation.

**[hello-world](./basic/hello-world/)** Uses input provided by user to change view, i.e. "Hello, textYouProvided".

**[http-random-user](./basic/http-random-user/)** Example that uses TypeScript to make HTTP requests. Passes events generated from one driver to another after transformation. TypeScript provides hints in supporting IDEs and prevents some errors that xstream doesn't handle well.

**[jsx-seconds-elapsed](./basic/jsx-seconds-elapsed/)** Timer rendered from JSX file that uses HTML tags.

#### Intermediate

**[animation](./intermediate/animation/)** Moves a square between 3 points in archs.

**[bmi-TypeScript](./intermediate/bmi-typescript/)** Correct version of BMI in xstream with TypeScript (reusable components through isolation).

**[hello-lastname](./intermediate/hello-lastname/)** Constructs and validates full name from two separate inputs, in TypeScript.

**[http-search-github](./intermediate/http-search-github/)** Searches for GitHub repositories filtered by text from input. Debounces HTTP calls, and selects the correct call result out of multiple provided by driver.

**[tsx-seconds-elapsed](./intermediate/tsx-seconds-elapsed/)** TypeScript and JSX usage demonstration by way of timer.

#### Advanced

**[animated-letters](./advanced/animated-letters/)** Will toggle showing letters on keypress, with font size change animation. State handling without @cycle/state.

**[autocomplete-search](./advanced/autocomplete-search/)**  Autocomplete field for Wikipedia. 

**[bmi-nested](./advanced/bmi-nested/)** Same as BMI-TypeScript in intermediate folder, but without the TypeScript.

**[custom-driver](./advanced/custom-driver/)** Chart driver that listens to sinks and produces source events passed through adapt library. 

**[isomorphic](./advanced/isomorphic/)** Example demonstrating usage of Cycle.js on the server to produce HTML document for server side rendering.

**[many](./advanced/many/)** Demonstrates state handling for list of items without @cycle/state.

**[nested-folders](./advanced/nested-folders/)** Demonstrates handling of list of folders potentially containing another list of folders- recursive-+ with @cycle/state.

**[routing-view](./advanced/routing-view/)** ie Renders a different page as if you clicked on a link without the reload. @cycle/history
