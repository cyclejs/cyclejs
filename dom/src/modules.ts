import {Module} from 'snabbdom/modules/module';
import ClassModule from 'snabbdom/modules/class';
import PropsModule from 'snabbdom/modules/props';
import AttrsModule from 'snabbdom/modules/attributes';
import StyleModule from 'snabbdom/modules/style';
import DatasetModule from 'snabbdom/modules/dataset';

const modules: Array<Module> = [
  StyleModule,
  ClassModule,
  PropsModule,
  AttrsModule,
  DatasetModule,
];

export {StyleModule, ClassModule, PropsModule, AttrsModule, DatasetModule};

export default modules;
