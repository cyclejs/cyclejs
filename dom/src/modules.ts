import {Module} from 'snabbdom/modules/module';
import ClassModule from 'snabbdom/modules/class';
import PropsModule from 'snabbdom/modules/props';
import AttrsModule from 'snabbdom/modules/attributes';
import EventsModule from 'snabbdom/modules/eventlisteners';
import StyleModule from 'snabbdom/modules/style';
import HeroModule from 'snabbdom/modules/hero';

const modules: Array<Module> = [StyleModule, ClassModule, PropsModule, AttrsModule];

export {
  StyleModule, ClassModule,
  PropsModule, AttrsModule,
  HeroModule, EventsModule,
}

export default modules;