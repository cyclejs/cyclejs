import {Module, classModule, propsModule, attributesModule, styleModule, datasetModule} from 'snabbdom';

const modules: Array<Module> = [
  styleModule,
  classModule,
  propsModule,
  attributesModule,
  datasetModule,
];

export {styleModule, classModule, propsModule, attributesModule, datasetModule};

export default modules;
