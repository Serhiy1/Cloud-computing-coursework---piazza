import express from "express";
import mongoose from "mongoose";
import { HttpError } from "../../utils/utils";
import { validationResult, matchedData } from "express-validator";
import { User, email, newUser, password, username } from "../../models/user";
import bcrypt from "bcrypt"

export const userRouter = express.Router();

userRouter.post("/signup", email(), password(), username(), (req, res, next) => {


  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(result.array());
  }

  const email = matchedData(req).email;
  const password = matchedData(req).password;
  const userName = matchedData(req).userName;
  const passwordHash = bcrypt.hashSync(password, 10)

  const user = newUser({
    _id: new mongoose.Types.ObjectId(),
    email : email,
    userName: userName,
    passordHash : passwordHash
  })

  user.save().then(result => {
    return res.status(201).json(result)
  }).catch(error => {
    next(new HttpError(500, error.message))
  })

});

userRouter.post("/login", (req, res, next) => {});

userRouter.get("/:userID", (req, res, next) => {});
