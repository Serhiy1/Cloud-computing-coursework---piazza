import express from "express";
import mongoose from "mongoose";
import {
  ContentVal,
  Post,
  TopicParamVal,
  TopicVal,
  ValidTopics,
  createNewPost,
  PostIDParamVal,
} from "../../models/post";
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
PostRouter.get("/topics/:topicID", TopicParamVal(), (req, res, next) => {
  const result = validationResult(req);
  console.log(result);
  if (!result.isEmpty()) {
    return res.status(400).json(result.array());
  }

  const topicID = matchedData(req).topicID;

  console.log(`listing all posts for topic ${topicID}`);

  Post.find({ topics: topicID, parent_id: null })
    .sort({ Created: -1 })
    .then((posts) => {
      res.status(200).json(posts);
    })
    .catch((error) => {
      const httpError = new HttpError(500, error.message);
      next(httpError);
    });
});

/* API for listing all posts without a topic filter that are not comments*/
PostRouter.get("/", (req, res, next) => {
  Post.find({ parent_id: null })
    .sort({ Created: -1 })
    .then((posts) => {
      res.status(200).json(posts);
    })
    .catch((error) => {
      const httpError = new HttpError(500, error.message);
      next(httpError);
    });
});

/* Get a single Post and its comments */
PostRouter.get("/:postID", PostIDParamVal(), (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(result.array());
  }

  const postID = matchedData(req).postID;

  Post.findById(postID)
    .then((post) => {
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      Post.find({ _id: { $in: post.childIds } })
        .then((comments) => {
          res.status(200).json({ post, comments });
        })
        .catch((commentError) => {
          const httpError = new HttpError(500, commentError.message);
          next(httpError);
        });
    })
    .catch((error) => {
      const httpError = new HttpError(500, error.message);
      next(httpError);
    });
});

PostRouter.post("/", ContentVal(), TopicVal(), (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(result.array());
  }

  const topicsFromRequest: ValidTopics[] = matchedData(req).topics;
  const postContent: string = matchedData(req).content;

  const post = createNewPost({
    _id: new mongoose.Types.ObjectId(),
    ownerId: new mongoose.Types.ObjectId("65663a1a771a7db15b32e2a6"),
    userName: "test user name",
    content: postContent,
    created: new Date(),
    topics: topicsFromRequest,
  });

  // Save the post object to the database
  post
    .save()
    .then((result) => {
      res.status(201).json(result);
    })
    .catch((error) => {
      const httpError = new HttpError(500, error.message);
      next(httpError);
    });
});

PostRouter.post("/:postID", PostIDParamVal(), ContentVal(), (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json(result.array());
  }

  const parentPostId = matchedData(req).postID;
  const postContent: string = matchedData(req).content;

  // Check if the parent post exists
  Post.findById(parentPostId)
    .then((parentPost) => {
      if (!parentPost) {
        res.status(404).json({ message: "Parent post not found" });
        return null; // Stop further execution
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

      return comment.save();
    })
    .then((savedComment) => {
      // Check if the operation was stopped earlier
      if (savedComment) {
        res.status(201).json(savedComment);
      }
    })
    .catch((error) => {
      if (error) {
        // Additional check to handle null from the first 'then' block
        const httpError = new HttpError(500, error.message);
        next(httpError);
      }
    });
});
