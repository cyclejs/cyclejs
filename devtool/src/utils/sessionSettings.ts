import { ZapSpeed } from '../panel/model';

export interface SessionSettings {
  zapSpeed: ZapSpeed;
}

// Settings that last only while the DevTool is open.
export const sessionSettings: SessionSettings = {
  zapSpeed: 'normal',
};
