import express from "express";
import mongoose from "mongoose";
import { HttpError } from "../../utils/utils";
import { validationResult, matchedData } from "express-validator";
import { User, email, newUser, password, username } from "../../models/user";
import bcrypt from "bcrypt";

export const userRouter = express.Router();

userRouter.post("/signup", email(), password(), username(), async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json(result.array());
    }

    const email = matchedData(req).email;
    const userName = matchedData(req).userName;

    // Check if the email already exists
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // Check if the username already exists
    const existingUserByUsername = await User.findOne({ userName });
    if (existingUserByUsername) {
      return res.status(409).json({ message: "Username already in use" });
    }

    // Hash the password and create a new user
    const password = matchedData(req).password;
    const passwordHash = bcrypt.hashSync(password, 10);

    const user = newUser({
      _id: new mongoose.Types.ObjectId(),
      email: email,
      userName: userName,
      passwordHash: passwordHash,
    });

    // Save the new user
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    next(new HttpError(500, (error as Error).message));
  }
});

userRouter.post("/login", (req, res, next) => {});

userRouter.get("/:userID", (req, res, next) => {});
