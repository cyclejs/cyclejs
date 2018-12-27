import view from './view';
import intent from './intent';
import model from './model';
import {httpRequest} from './httpHelpers';

export default function dropareaUploader(sources) {
  const {DOM, HTTP, state} = sources;

  const actions = intent(DOM);
  const reducer$ = model(actions, HTTP);
  const request$ = httpRequest(state.stream);
  const vtree$ = view(state.stream);
  return {
    DOM: vtree$,
    HTTP: request$,
    state: reducer$,
    preventDefault: actions.preventDefault$,
  };
}
