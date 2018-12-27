import xs from 'xstream';
import {run} from '@cycle/run';
import {makeHTTPDriver} from '@cycle/http';
import {makeDOMDriver} from '@cycle/dom';
import {withState} from '@cycle/state';

import DropareaUploader from './DropareaUploader';

function preventDefaultSinkDriver(prevented$) {
  prevented$.addListener({
    next: ev => {
      ev.preventDefault();
      if (ev.type === 'blur') {
        ev.target.focus();
      }
    },
    error: () => {
      /** Error */
    },
    complete: () => {
      /** Complete */
    },
  });
  return xs.empty();
}

const wrappedMain = withState(DropareaUploader);

const drivers = {
  HTTP: makeHTTPDriver(),
  DOM: makeDOMDriver('#main-container'),
  preventDefault: preventDefaultSinkDriver,
};

run(wrappedMain, drivers);
