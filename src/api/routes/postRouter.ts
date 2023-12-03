import express from "express";
import mongoose from "mongoose";
import { Content, Post, TopicParam, Topic, ValidTopics, createNewPost, PostIDParam } from "../../models/post";
import { HttpError } from "../../utils/utils";
import { validationResult, matchedData } from "express-validator";

export const PostRouter = express.Router();

/* API for listing all avalible topics */
PostRouter.get("/topics", async (req, res) => {
  console.log(`listing all avalible topics`);

  res.status(200).json({
    topics: Object.keys(ValidTopics),
  });
});

/* API for listing all posts that are not comments in a specific Topic */
PostRouter.get("/topics/:topicID", TopicParam(), async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json(result.array());
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
PostRouter.get("/", async (req, res, next) => {
  try {
    const posts = await Post.find({ parent_id: null }).sort({ Created: -1 });
    res.status(200).json(posts);
  } catch (error) {
    const httpError = new HttpError(500, (error as Error).message);
    next(httpError);
  }
});

/* Get a single Post and its comments */
PostRouter.get("/:postID", PostIDParam(), async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json(result.array());
    }

    const postID = matchedData(req).postID;

    const post = await Post.findById(postID);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comments = await Post.find({ _id: { $in: post.childIds } });
    res.status(200).json({ post, comments });
  } catch (error) {
    const httpError = new HttpError(500, (error as Error).message);
    next(httpError);
  }
});

PostRouter.post("/", Content(), Topic(), async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json(result.array());
    }

    const topicsFromRequest = matchedData(req).topics;
    const postContent = matchedData(req).content;

    const post = createNewPost({
      _id: new mongoose.Types.ObjectId(),
      ownerId: new mongoose.Types.ObjectId("65663a1a771a7db15b32e2a6"),
      userName: "test user name",
      content: postContent,
      created: new Date(),
      topics: topicsFromRequest,
    });

    const savedPost = await post.save();
    res.status(201).json(savedPost);
  } catch (error) {
    const httpError = new HttpError(500, (error as Error).message);
    next(httpError);
  }
});

PostRouter.post("/:postID", PostIDParam(), Content(), async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json(result.array());
    }

    const parentPostId = matchedData(req).postID;
    const postContent = matchedData(req).content;

    // Check if the parent post exists
    const parentPost = await Post.findById(parentPostId);
    if (!parentPost) {
      return res.status(404).json({ message: "Parent post not found" });
    }

    // Check if the post is active
    // @ts-ignore
    if (!parentPost.isActive()) {
      return next(new HttpError(400, "The post is no longer active, you cannot interactive with it"));
    }

    // If the parent post exists, create the comment
    const comment = createNewPost({
      _id: new mongoose.Types.ObjectId(),
      ownerId: new mongoose.Types.ObjectId("65663a1a771a7db15b32e2a6"), // Replace with actual owner ID from auth
      userName: "commenter user name", // Replace with actual username from auth
      parentId: new mongoose.Types.ObjectId(parentPostId),
      content: postContent,
      created: new Date(),
      topics: parentPost.topics, // Inherit topics from parent post
    });

    const savedComment = await comment.save();
    return res.status(201).json(savedComment);
  } catch (error) {
    // Handle errors from any of the await statements
    const httpError = new HttpError(500, (error as Error).message);
    next(httpError);
  }
});

PostRouter.post("/:postID/like", PostIDParam(), async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json(result.array());
    }

    const postID = matchedData(req).postID;

    const updatedPost = await Post.findByIdAndUpdate(postID, { $inc: { likes: 1 } }, { new: true });
    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(updatedPost);
  } catch (error) {
    next(new HttpError(500, (error as Error).message));
  }
});

PostRouter.post("/:postID/dislike", PostIDParam(), async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json(result.array());
    }

    const postID = matchedData(req).postID;

    const updatedPost = await Post.findByIdAndUpdate(postID, { $inc: { dislikes: 1 } }, { new: true });
    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(updatedPost);
  } catch (error) {
    next(new HttpError(500, (error as Error).message));
  }
});
