declare const process: any;
process.__testSandbox = {};
export const globalSandbox: any = process.__testSandbox;
