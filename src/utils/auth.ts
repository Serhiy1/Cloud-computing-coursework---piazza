import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWTSignKey } from "../app";
import { HttpError } from "./utils";

interface tokenInfo {
  email: string,
  username: string,
  id: string,
}

export const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization === undefined) {
    return next(new HttpError(403, "token is missing"));
  }

  const [prefix, token] = req.headers.authorization.split(" ");

  try {
    const decoded = jwt.verify(token, JWTSignKey, { complete: true });
  } catch (error) {
    next(new HttpError(403, (error as Error).message));
  } finally {
    next();
  }
};

export function getUser(req: Request) : tokenInfo {
  // the check auth middleware should have already verified that the token is valid
  const [prefix, token] = (req.headers.authorization as string).split(" ");
  return (jwt.decode(token) as tokenInfo);
}
