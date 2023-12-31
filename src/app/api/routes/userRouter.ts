import bcrypt from "bcrypt";
import express from "express";
import { matchedData, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { JWTSignKey } from "../../app";
import { Post } from "../../models/post";
import { newUser, passwordExists, User, userIDParam, V_email, V_password, V_username } from "../../models/user";
import { checkAuth, getUser } from "../../utils/auth";
import { HttpError } from "../../utils/utils";

export const userRouter = express.Router();

/* Enpoint for creating a new user */
userRouter.post("/signup", V_email(), V_password(), V_username(), async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(new HttpError(400, result.array()));
    }

    const email = matchedData(req).email;
    const userName = matchedData(req).userName;

    // Check if the email already exists
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return next(new HttpError(409, "Email already in use"));
    }

    // Check if the username already exists
    const existingUserByUsername = await User.findOne({ userName });
    if (existingUserByUsername) {
      return next(new HttpError(409, "Username already in use"));
    }

    // Hash the password and create a new user
    const password = matchedData(req).password;
    const passwordHash = bcrypt.hashSync(password, 10);

    const user = newUser({
      _id: new mongoose.Types.ObjectId(),
      email: email,
      userName: userName,
      passwordHash: passwordHash,
      likedComments: [],
      diLikedComments: [],
    });

    // Save the new user
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    next(new HttpError(500, (error as Error).message));
  }
});

/* Enpoint for logging in as a user */
userRouter.post("/login", V_email(), passwordExists(), async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(new HttpError(400, result.array()));
    }

    const email = matchedData(req).email;
    const password = matchedData(req).password;

    // check if the user exists
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      return next(new HttpError(401, "Auth Failed"));
    }

    // If the user exists check if the password has matches
    if (!bcrypt.compareSync(password, existingUser.passwordHash)) {
      return next(new HttpError(401, "Auth Failed"));
    }

    // if the password matches return a jwt token
    const token = jwt.sign(
      {
        email: existingUser.email,
        username: existingUser.userName,
        id: existingUser._id,
      },
      JWTSignKey,
      { expiresIn: "1 hour" }
    );

    return res.status(200).json({ message: "auth succeeded", token: token });
  } catch (error) {
    return next(new HttpError(500, (error as Error).message));
  }
});

/* Enpoint for viewing user info and thier comments */
userRouter.get("/:userID", userIDParam(), checkAuth, async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(new HttpError(400, result.array()));
    }

    const userId = matchedData(req).userId;

    const user = await User.findById(userId);

    if (!user) {
      return next(new HttpError(404, "user not found"));
    }

    const posts: (typeof Post)[] = await Post.find({ ownerId: user._id, parentId: null });
    const comments = await Post.find({ ownerId: user._id, parentId: { $ne: null } });

    return res.status(200).json({ user: user, posts: posts, comments: comments });
  } catch (error) {
    next(new HttpError(500, (error as Error).message));
  }
});

/* Enpoint for viewing own user info */
userRouter.get("/", checkAuth, async (req, res, next) => {
  const tokenInfo = getUser(req);
  try {
    const user = await User.findById(tokenInfo.id);

    if (!user) {
      return next(new HttpError(404, "user not found"));
    }

    const posts: (typeof Post)[] = await Post.find({ ownerId: user._id, parentId: null });
    const comments = await Post.find({ ownerId: user._id, parentId: { $ne: null } });

    return res.status(200).json({ user: user, posts: posts, comments: comments });
  } catch (error) {
    next(new HttpError(500, (error as Error).message));
  }
});
