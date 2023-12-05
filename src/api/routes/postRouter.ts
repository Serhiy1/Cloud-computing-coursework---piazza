import express from "express";
import mongoose from "mongoose";
import { V_Content, Post, TopicParam, V_Topic, ValidTopics, createNewPost, PostIDParam } from "../../models/post";
import { HttpError } from "../../utils/utils";
import { validationResult, matchedData } from "express-validator";
import { checkAuth, getUser } from "../../utils/auth";
import { User } from "../../models/user";

export const PostRouter = express.Router();

/* API for listing all avalible topics */
PostRouter.get("/topics", checkAuth, async (req, res) => {
  console.log(`listing all avalible topics`);

  res.status(200).json({
    topics: Object.keys(ValidTopics),
  });
});

/* API for listing all posts that are not comments in a specific Topic */
PostRouter.get("/topics/:topicID", checkAuth, TopicParam(), async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(new HttpError(400, result.array()));
    }

    const topicID = matchedData(req).topicID;

    console.log(`listing all posts for topic ${topicID}`);
    const posts = await Post.find({ topics: topicID, parent_id: null }).sort({ Created: -1 });
    res.status(200).json(posts);
  } catch (error) {
    const httpError = new HttpError(500, (error as Error).message);
    next(httpError);
  }
});

/* API for listing all posts without a topic filter that are not comments*/
PostRouter.get("/", checkAuth, async (req, res, next) => {
  try {
    const posts = await Post.find({ parent_id: null }).sort({ Created: -1 });
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

PostRouter.post("/", checkAuth, V_Content(), V_Topic(), async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(new HttpError(400, result.array()));
    }

    const topicsFromRequest = matchedData(req).topics;
    const postContent = matchedData(req).content;
    const user = getUser(req);

    const post = createNewPost({
      _id: new mongoose.Types.ObjectId(),
      parentId: null,
      ownerId: new mongoose.Types.ObjectId(user.id),
      userName: user.username,
      content: postContent,
      created: new Date(),
      topics: topicsFromRequest,
      childIds: [],
      likes: 0,
      dislikes: 0,
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
    // @ts-ignore
    if (!parentPost.isActive()) {
      return next(new HttpError(400, "The post is no longer active, you cannot interact with it"));
    }

    // If the parent post exists, create the comment
    const comment = createNewPost({
      _id: new mongoose.Types.ObjectId(),
      ownerId: new mongoose.Types.ObjectId(user.id),
      userName: user.username,
      parentId: new mongoose.Types.ObjectId(parentPostId),
      content: postContent,
      created: new Date(),
      topics: parentPost.topics, // Inherit topics from parent post
      childIds: [],
      likes: 0,
      dislikes: 0,
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
    // @ts-ignore
    if (!post.isActive()) {
      return next(new HttpError(400, "The post is no longer active, you cannot interact with it"));
    }

    // Fetch the user
    const user = await User.findById(userInfo.id);
    if (!user) {
      return next(new HttpError(400, "User not found"));
    }

    // Check if the user has already liked this post
    const hasLiked = user.likedComments.includes(postID);
    const hasDisLiked = user.diLikedComments.includes(postID);

    if (hasLiked) {
      // User has already liked the post, so decrement like and remove from liked comments
      post.likes = Math.max(0, post.likes - 1); // Ensure likes don't go negative
      user.likedComments = user.likedComments.filter((commentID) => commentID.toString() !== postID);
    } else if (hasDisLiked) {
      // User has already disliked the post, so decrement dislikes and remove from disliked comments
      post.dislikes = Math.max(0, post.dislikes - 1); // Ensure dislikes don't go negative
      user.diLikedComments = user.diLikedComments.filter((commentID) => commentID.toString() !== postID);
    } else {
      // User has not liked the post, so increment like and add to liked comments
      post.likes = (post.likes || 0) + 1;
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
    // @ts-ignore
    if (!post.isActive()) {
      return next(new HttpError(400, "The post is no longer active, you cannot interact with it"));
    }

    // Fetch the user
    const user = await User.findById(userInfo.id);
    if (!user) {
      return next(new HttpError(400, "User not found"));
    }

    // Check if the user has already disliked this post
    const hasLiked = user.likedComments.includes(postID);
    const hasDisLiked = user.diLikedComments.includes(postID);

    if (hasDisLiked) {
      // User has already disliked the post, so decrement dislike and remove from disliked comments
      post.dislikes = Math.max(0, post.dislikes - 1); // Ensure likes don't go negative
      user.diLikedComments = user.diLikedComments.filter((commentID) => commentID.toString() !== postID);
    } else if (hasLiked) {
      // User has already liked the post, so decrement like and remove from liked comments
      post.likes = Math.max(0, post.likes - 1); // Ensure likes don't go negative
      user.likedComments = user.likedComments.filter((commentID) => commentID.toString() !== postID);
    } else {
      // User has not liked the post, so increment dislike and add to liked comments
      post.dislikes = (post.dislikes || 0) + 1;
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
