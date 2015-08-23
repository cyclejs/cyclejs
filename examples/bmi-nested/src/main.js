import {run} from '@cycle/core';
import {makeDOMDriver} from '@cycle/dom';
import bmiCalculator from './bmi-calculator';

const main = bmiCalculator;

run(main, {
  DOM: makeDOMDriver('#main-container')
});
