import type { ErrorRequestHandler } from "express";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";

import { PostRouter } from "./api/routes/postRouter";
import { userRouter } from "./api/routes/userRouter";
import { GetEnvValue, HttpError } from "./utils/utils";

const connectionString = GetEnvValue("MongoConnectionString");
export const JWTSignKey = GetEnvValue("JWTKey");
export const expiryTimeHours = Number(GetEnvValue("ExpiryTimeHours"));

mongoose.connect(connectionString);

export const app = express();
// enable global logging on the project
app.use(morgan("dev"));

// enable custom JSON
app.use(express.json());

// handle requests for known routes
app.use("/posts", PostRouter);
app.use("/user", userRouter);

// Deal cross resource compatibility with single page applications
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, COntent-Type, Accept, Authorization");

  // browser compatibility, browsers sends this first before actual requests
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE");
    return res.status(200).json({});
  }
  next();
});

// handle requests for all unknown routes
app.use((req, res, next) => {
  const error = new HttpError(404, "not found");
  next(error);
});

// generic error handler
const errorHandler: ErrorRequestHandler = (err: HttpError, req, res, next) => {
  res.statusCode = err.statuscode;
  res.json({
    error_message: err.message
  });
};
app.use(errorHandler);
