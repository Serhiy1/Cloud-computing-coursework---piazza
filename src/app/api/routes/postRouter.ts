import express from "express";
import { matchedData, validationResult } from "express-validator";
import mongoose, { SortOrder } from "mongoose";

import {
  createNewPost,
  orderByQuery,
  Post,
  PostIDParam,
  TopicParam,
  V_Content,
  V_title,
  V_Topic,
  ValidTopics,
} from "../../models/post";
import { User } from "../../models/user";
import { checkAuth, getUser } from "../../utils/auth";
import { GetExpiryDate, HttpError } from "../../utils/utils";

export const PostRouter = express.Router();

/* API for listing all available topics */
PostRouter.get("/topics", checkAuth, async (req, res) => {
  console.log(`listing all available topics`);

  res.status(200).json({
    topics: Object.keys(ValidTopics),
  });
});

/* API for listing all posts that are not comments and are not expired in a specific Topic */
PostRouter.get("/topics/:topicID", checkAuth, TopicParam(), orderByQuery(), async (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return next(new HttpError(400, result.array()));
  }
  try {
    const topicID = matchedData(req).topicID;
    const expiryTime = GetExpiryDate();
    const orderBy = req.query.orderBy as string;

    // Define a sorting object based on the orderBy value

    let sortCriteria: { [key: string]: SortOrder } = { Created: -1 }; // Default sorting

    if (orderBy === "Likes") {
      sortCriteria = { likes: -1 };
    } else if (orderBy === "Dislikes") {
      sortCriteria = { dislikes: -1 };
    } else if (orderBy === "Activity") {
      sortCriteria = { activity: -1 };
    }

    const posts = await Post.find({ topics: topicID, parentId: null, created: { $gte: expiryTime } }).sort(
      sortCriteria
    );
    res.status(200).json(posts);
  } catch (error) {
    const httpError = new HttpError(500, (error as Error).message);
    next(httpError);
  }
});

/* API for listing all posts that are not comments and are expired in a specific Topic */
PostRouter.get("/topics/:topicID/expired", checkAuth, TopicParam(), async (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return next(new HttpError(400, result.array()));
  }
  try {
    const topicID = matchedData(req).topicID;
    const expiryTime = GetExpiryDate();
    const orderBy = req.query.orderBy as string;

    // Define a sorting object based on the orderBy value

    let sortCriteria: { [key: string]: SortOrder } = { Created: -1 }; // Default sorting

    if (orderBy === "Likes") {
      sortCriteria = { likes: -1 };
    } else if (orderBy === "Dislikes") {
      sortCriteria = { dislikes: -1 };
    } else if (orderBy === "Activity") {
      sortCriteria = { activity: -1 };
    }

    const posts = await Post.find({ topics: topicID, parentId: null, created: { $lte: expiryTime } }).sort(
      sortCriteria
    );
    res.status(200).json(posts);
  } catch (error) {
    const httpError = new HttpError(500, (error as Error).message);
    next(httpError);
  }
});

/* API for listing all posts without a topic filter, are expired and that are not comments*/
PostRouter.get("/expired", checkAuth, orderByQuery(), async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const expiryTime = GetExpiryDate();
    const orderBy = req.query.orderBy as string;

    // Define a sorting object based on the orderBy value

    let sortCriteria: { [key: string]: SortOrder } = { Created: -1 }; // Default sorting

    if (orderBy === "Likes") {
      sortCriteria = { likes: -1 };
    } else if (orderBy === "Dislikes") {
      sortCriteria = { dislikes: -1 };
    } else if (orderBy === "Activity") {
      sortCriteria = { activity: -1 };
    }

    const posts = await Post.find({ parentId: null, created: { $lte: expiryTime } }).sort(sortCriteria);
    res.status(200).json(posts);
  } catch (error) {
    const httpError = new HttpError(500, (error as Error).message);
    next(httpError);
  }
});

/* API for listing all posts without a topic filter, are expired and that are not comments*/
PostRouter.get("/", checkAuth, orderByQuery(), async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const expiryTime = GetExpiryDate();
    const orderBy = req.query.orderBy as string;

    // Define a sorting object based on the orderBy value

    let sortCriteria: { [key: string]: SortOrder } = { Created: -1 }; // Default sorting

    if (orderBy === "Likes") {
      sortCriteria = { likes: -1 };
    } else if (orderBy === "Dislikes") {
      sortCriteria = { dislikes: -1 };
    } else if (orderBy === "Activity") {
      sortCriteria = { activity: -1 };
    }

    const posts = await Post.find({ parentId: null, created: { $gte: expiryTime } }).sort(sortCriteria);
    res.status(200).json(posts);
  } catch (error) {
    const httpError = new HttpError(500, (error as Error).message);
    next(httpError);
  }
});

/* Get a single Post and its comments */
PostRouter.get("/:postID", checkAuth, PostIDParam(), async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(new HttpError(400, result.array()));
    }

    const postID = matchedData(req).postID;

    const post = await Post.findById(postID);
    if (!post) {
      return next(new HttpError(404, "Post not found"));
    }

    const comments = await Post.find({ _id: { $in: post.childIds } });
    res.status(200).json({ post, comments });
  } catch (error) {
    const httpError = new HttpError(500, (error as Error).message);
    next(httpError);
  }
});

PostRouter.post("/", checkAuth, V_title(), V_Content(), V_Topic(), async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(new HttpError(400, result.array()));
    }

    const topicsFromRequest = matchedData(req).topics;
    const postContent = matchedData(req).content;
    const title = matchedData(req).title;
    const user = getUser(req);

    const post = createNewPost({
      _id: new mongoose.Types.ObjectId(),
      title: title,
      parentId: null,
      ownerId: new mongoose.Types.ObjectId(user.id),
      userName: user.username,
      content: postContent,
      created: new Date(),
      topics: topicsFromRequest,
      childIds: [],
      likes: 0,
      dislikes: 0,
      activity: 0,
    });

    const savedPost = await post.save();
    res.status(201).json(savedPost);
  } catch (error) {
    const httpError = new HttpError(500, (error as Error).message);
    next(httpError);
  }
});

PostRouter.post("/:postID", checkAuth, PostIDParam(), V_Content(), async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(new HttpError(400, result.array()));
    }

    const parentPostId = matchedData(req).postID;
    const postContent = matchedData(req).content;
    const user = getUser(req);

    // Check if the parent post exists
    const parentPost = await Post.findById(parentPostId);
    if (!parentPost) {
      return next(new HttpError(404, "Parent Post not found"));
    }

    // Check if the post is active
    // @ts-expect-error This is is set through the mongoose `Method` accessor which is not type compatible
    if (!parentPost.isActive()) {
      return next(new HttpError(400, "The post is expired, you cannot interact with it"));
    }

    // If the parent post exists, create the comment
    const comment = createNewPost({
      _id: new mongoose.Types.ObjectId(),
      title: null,
      ownerId: new mongoose.Types.ObjectId(user.id),
      userName: user.username,
      parentId: new mongoose.Types.ObjectId(parentPostId),
      content: postContent,
      created: new Date(),
      topics: parentPost.topics, // Inherit topics from parent post
      childIds: [],
      likes: 0,
      dislikes: 0,
      activity: 0,
    });

    parentPost.childIds.push(comment._id);
    session.startTransaction();
    await Promise.all([comment.save(), parentPost.save()]);
    session.commitTransaction();
    session.endSession();

    return res.status(201).json(comment);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    const httpError = new HttpError(500, (error as Error).message);
    next(httpError);
  }
});

PostRouter.post("/:postID/like", checkAuth, PostIDParam(), async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(new HttpError(400, result.array()));
    }

    const postID = matchedData(req).postID;
    const userInfo = getUser(req);

    const post = await Post.findById(postID);
    if (!post) {
      return next(new HttpError(400, "The post does not exist"));
    }
    // @ts-expect-error, This is is set through the mongoose `Method` accessor which is not type compatible
    if (!post.isActive()) {
      return next(new HttpError(400, "The post is expired, you cannot interact with it"));
    }

    // Fetch the user
    const user = await User.findById(userInfo.id);
    if (!user) {
      return next(new HttpError(400, "User not found"));
    }

    if (post.ownerId == user.id) {
      return next(new HttpError(400, "you cannot like your own post"));
    }

    // Check if the user has already liked this post
    const hasLiked = user.likedComments.includes(postID);
    const hasDisLiked = user.diLikedComments.includes(postID);

    if (hasLiked) {
      // User has already liked the post, so decrement like and remove from liked comments
      post.likes = Math.max(0, post.likes - 1); // Ensure likes don't go negative
      post.activity = Math.max(0, post.activity - 1);
      user.likedComments = user.likedComments.filter((commentID) => commentID.toString() !== postID);
    } else if (hasDisLiked) {
      // User has already disliked the post, so decrement dislikes and remove from disliked comments
      post.dislikes = Math.max(0, post.dislikes - 1); // Ensure dislikes don't go negative
      post.activity = Math.max(0, post.activity - 1);
      user.diLikedComments = user.diLikedComments.filter((commentID) => commentID.toString() !== postID);
    } else {
      // User has not liked the post, so increment like and add to liked comments
      post.likes = (post.likes || 0) + 1;
      post.activity = (post.activity || 0) + 1;
      user.likedComments.push(postID);
    }

    // Save both the updated post and user
    session.startTransaction();
    await Promise.all([post.save(), user.save()]);
    session.commitTransaction();
    session.endSession();

    res.status(200).json(post);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(new HttpError(500, (error as Error).message));
  }
});

PostRouter.post("/:postID/dislike", checkAuth, PostIDParam(), async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(new HttpError(400, result.array()));
    }

    const postID = matchedData(req).postID;
    const userInfo = getUser(req);

    const post = await Post.findById(postID);
    if (!post) {
      return next(new HttpError(400, "The post does not exist"));
    }
    // @ts-expect-error, This is is set through the mongoose `Method` accessor which is not type compatible
    if (!post.isActive()) {
      return next(new HttpError(400, "The post is expired, you cannot interact with it"));
    }

    // Fetch the user
    const user = await User.findById(userInfo.id);
    if (!user) {
      return next(new HttpError(400, "User not found"));
    }

    if (post.ownerId == user.id) {
      return next(new HttpError(400, "you cannot dislike your own post"));
    }

    // Check if the user has already disliked this post
    const hasLiked = user.likedComments.includes(postID);
    const hasDisLiked = user.diLikedComments.includes(postID);

    if (hasDisLiked) {
      // User has already disliked the post, so decrement dislike and remove from disliked comments
      post.dislikes = Math.max(0, post.dislikes - 1); // Ensure likes don't go negative
      post.activity = Math.max(0, post.activity - 1);
      user.diLikedComments = user.diLikedComments.filter((commentID) => commentID.toString() !== postID);
    } else if (hasLiked) {
      // User has already liked the post, so decrement like and remove from liked comments
      post.likes = Math.max(0, post.likes - 1); // Ensure likes don't go negative
      post.activity = Math.max(0, post.activity - 1);
      user.likedComments = user.likedComments.filter((commentID) => commentID.toString() !== postID);
    } else {
      // User has not liked the post, so increment dislike and add to liked comments
      post.dislikes = (post.dislikes || 0) + 1;
      post.activity = (post.activity || 0) + 1;
      user.diLikedComments.push(postID);
    }

    // Save both the updated post and user
    session.startTransaction();
    await Promise.all([post.save(), user.save()]);
    session.commitTransaction();
    session.endSession();

    res.status(200).json(post);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(new HttpError(500, (error as Error).message));
  }
});
