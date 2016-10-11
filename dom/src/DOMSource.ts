import {StreamAdapter} from '@cycle/base';
import {DOMSourceOptions} from './DOMSourceOptions';
import {GenericStream} from './GenericStream';
import {EventsFnOptions} from './EventsFnOptions';

export abstract class DOMSource {
  protected _runStreamAdapter: StreamAdapter;
  protected _driverKey: string;

  constructor(options: DOMSourceOptions) {
    this._runStreamAdapter = options.runStreamAdapter;
    this._driverKey = options.driverKey;
  }

  abstract elements(): GenericStream;
  abstract select(selector: string): DOMSource;
  abstract events(eventType: string, options?: EventsFnOptions): GenericStream;
}
