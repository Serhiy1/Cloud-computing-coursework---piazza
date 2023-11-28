import express from "express";
import { Post } from "../../models/post";
import mongoose from "mongoose";

export const PostRouter = express.Router();

PostRouter.get("/topics", (req, res, next) => {
  res.status(200).json({
    message: "listing all valid topics ",
  });
});

PostRouter.get("/topics/:topicID", (req, res, next) => {
  res.status(200).json({
    message: "listing all posts a specific topic ",
  });
});

PostRouter.get("/", (req, res, next) => {
  res.status(200).json({
    message: "listing all posts on the platform ",
  });
});

PostRouter.get("/:postId", (req, res, next) => {
  const id = req.params.postId;

  res.status(200).json({
    message: `getting a single post and its comments`,
  });
});

PostRouter.post("/", (req, res, next) => {

  // creating a new post mongo object
  const post = new Post({
    _id: new mongoose.Types.ObjectId(),
    ownerId: new mongoose.Types.ObjectId(),
    userName: "test user name",
    parentId: null,
    childIds: [],
    content: req.body.content,
    likes: 0,
    dislikes: 0,
    created: new Date(),
    topics: req.body.topics,
  });

  // save and handle the post object to mongo database
  post
    .save()
    .then((result) => {
      console.log(result);
    })
    .catch((err) => {
      console.log(err);
    });

  res.status(200).json({
    message: `Creating a new post`,
  });
});

PostRouter.post("/:postId", (req, res, next) => {
  res.status(200).json({
    message: `Adding comment to existing post`,
  });
});

/*

=== Notes === :
To implemement a thread like overview of comments a recursive search will be needed.
https://stackoverflow.com/questions/42787293/mongodb-recursive-query

All items should be sorted by created date

=== api Interface design === :

GET ${host}/posts/topics -> return a list of valid topics
GET ${host}/posts/topics/${topicID} -> return a list of all the posts matching that topic

GET ${host}/posts -> return a list of all the posts without any topic filter
GET ${host}/posts/${postID} -> view a single post and a list of all the comments on it

POST ${host}/posts -> When the user wants to create a new post
POST ${host}/posts/${postID} -> When the user wants to comment on a post

*/
