import 'express';
import { IInputs } from './types/interfaces/inputs';
import { MondayAuthorization } from './types/interfaces/monday-authorization';

interface Locals {
  mondayAuthorization: MondayAuthorization;
  inputs: IInputs;
}

declare module 'express' {
  export interface Response {
    locals: Locals;
  }
}
