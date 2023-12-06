import { ValidationError } from "express-validator";

import { expiryTimeHours } from "../app";

/* Custom Error Object for typescipt compatibility*/
export class HttpError {
  statuscode: number;
  message: string | null | undefined | ValidationError[];

  constructor(status?: number, message?: string | ValidationError[]) {
    this.statuscode = status || 500;
    this.message = message;
  }
}

export function GetEnvValue(name: string): string {
  return (
    process.env[name] ||
    (() => {
      throw new Error(`${name} environment variables is not set`);
    })()
  );
}

export function GetExpiryDate() {
  const currentDate = new Date();
  return new Date(currentDate.setHours(currentDate.getHours() - expiryTimeHours));
}
