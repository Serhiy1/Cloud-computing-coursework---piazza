import express from "express";
import { Post, ValidTopics } from "../../models/post";
import mongoose from "mongoose";
import { HttpError } from "../../utils/utils";

export const PostRouter = express.Router();

/* API for listing all avalible topics */
PostRouter.get("/topics", async (req, res) => {
  console.log(`listing all avalible topics`);

  res.status(200).json({
    topics: Object.keys(ValidTopics),
  });
});

/* API for listing all posts that are not comments in a specific Topic */
PostRouter.get("/topics/:topicID", (req, res, next) => {
  const topicID = req.params.topicID;

  // Check if the topicID is a valid topic
  if (!Object.values(ValidTopics).includes(topicID as ValidTopics)) {
    return res.status(400).json({ message: "Invalid topic" });
  }

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
PostRouter.get("/:postID", (req, res, next) => {
  const postID = req.params.postID;

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

PostRouter.post("/", (req, res, next) => {
  const topicsFromRequest: ValidTopics[] = req.body.topics;
  // Check if all topics from the request are valid
  const invalidTopics = topicsFromRequest.filter((topic) => !Object.values(ValidTopics).includes(topic));

  // Return error if any invalid topics have been selected
  if (invalidTopics.length > 0) {
    return res.status(400).json({
      message: "Invalid topic(s) provided",
      invalidTopics: invalidTopics,
    });
  }

  // Create a new post object
  const post = new Post({
    _id: new mongoose.Types.ObjectId(),
    owner_id: new mongoose.Types.ObjectId("65663a1a771a7db15b32e2a6"), // Replace with actual owner ID
    user_name: "test user name", // Replace with actual username
    parent_id: null,
    child_ids: [],
    content: req.body.content,
    likes: 0,
    dislikes: 0,
    Created: new Date(),
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

PostRouter.post("/:postID", (req, res, next) => {
  const parentPostId = req.params.postID;

  // Check if the parent post exists
  Post.findById(parentPostId)
    .then((parentPost) => {
      if (!parentPost) {
        res.status(404).json({ message: "Parent post not found" });
        return null; // Stop further execution
      }

      // If the parent post exists, create the comment
      const comment = new Post({
        _id: new mongoose.Types.ObjectId(),
        owner_id: new mongoose.Types.ObjectId("65663a1a771a7db15b32e2a6"), // Replace with actual owner ID from auth
        user_name: "commenter user name", // Replace with actual username from auth
        parent_id: parentPostId,
        child_ids: [],
        content: req.body.content,
        likes: 0,
        dislikes: 0,
        Created: new Date(),
        topics: parentPost.topics, // Inherit topics from parent post
      });

      return comment.save(); // Return the save operation's promise
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
