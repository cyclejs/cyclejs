import {run} from '@cycle/xstream-run';
import {makeDOMDriver, div, input} from '@cycle/dom';
import {timeDriver} from '../';
import sampleCombine from 'xstream/extra/sampleCombine';

const maxSpeed = 500;
const maxHeight = 100;
const maxWidth = 15 * 50;
const maxNodeCount = 100;

function range (start, end) {
  let i = 0;
  return new Array(end - start).fill(0).map(() => {
    return start + i++;
  });
}

function fancyColor (timestamp, i, offset) {
  return Math.abs(Math.round((timestamp + (offset * 100) + (i * 20)) % 512) - 255);
}

function nodes (timestamp, speed, height, nodeCount) {
  const increment = maxWidth / nodeCount;

  return (
    div('.nodes', range(1, nodeCount).map(i =>
      div('.node', {
        key: i,
        style: {
          position: `absolute`,
          color: `rgb(${fancyColor(timestamp, i, 0)}, ${fancyColor(timestamp, i, 1)}, ${fancyColor(timestamp, i, 2)})`,
          left: (increment * i) + 'px',
          top: (Math.sin((increment * i) + timestamp / (maxSpeed - speed)) * height + 150).toString() + 'px'
        }
      }, '.')
    ))
  );
}

function main (sources) {
  const {DOM, Time} = sources;

  const speed$ = DOM
    .select('.speed')
    .events('input')
    .map(ev => ev.target.value)
    .startWith(maxSpeed / 2);

  const height$ = DOM
    .select('.height')
    .events('input')
    .map(ev => ev.target.value)
    .startWith(maxHeight / 2);

  const nodeCount$ = DOM
    .select('.node-count')
    .events('input')
    .map(ev => ev.target.value)
    .startWith(45);

  const time$ = Time.animationFrames().map(({time}) => time);

  return {
    DOM: time$.compose(sampleCombine(speed$, height$, nodeCount$)).map(([timestamp, speed, height, nodeCount]) =>
      div('.time', [
        nodes(timestamp, speed, height, nodeCount),
        'Speed',
        input('.speed', {props: {type: 'range', min: 1, max: maxSpeed, value: speed}}),
        'Height',
        input('.height', {props: {type: 'range', min: 1, max: maxHeight, value: height}}),
        'Nodes',
        input('.node-count', {props: {type: 'range', min: 1, max: maxNodeCount, value: nodeCount}}),
      ])
    )
  };
}

const drivers = {
  DOM: makeDOMDriver('.app'),
  Time: timeDriver
};

run(main, drivers);
