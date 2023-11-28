/* Custom Error Object for typescipt compatibility*/
export class HttpError {
  statuscode: number;
  message: string | null | undefined;

  constructor(status?: number, message?: string) {
    this.statuscode = status || 500;
    this.message = message;
  }
}

export function GetEnvValue(name: string): string {
  return (
    process.env[name] ||
    (() => {
      throw new Error(`${name} enviromemtn variables is not set`);
    })()
  );
}
