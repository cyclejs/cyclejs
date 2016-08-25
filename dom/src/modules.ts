declare function require(s: string): any;
const ClassModule = require('snabbdom/modules/class');
const PropsModule = require('snabbdom/modules/props');
const AttrsModule = require('snabbdom/modules/attributes');
const DatasetModule = require('snabbdom/modules/dataset');
const EventsModule = require('snabbdom/modules/eventlisteners');
const StyleModule = require('snabbdom/modules/style');
const HeroModule = require('snabbdom/modules/hero');

export default [StyleModule, ClassModule, PropsModule, AttrsModule, DatasetModule];

export {
  StyleModule, ClassModule,
  PropsModule, AttrsModule,
  HeroModule, EventsModule,
  DatasetModule,
}
