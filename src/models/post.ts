import mongoose from "mongoose";
import { Schema, model } from "mongoose";
import { body, param } from "express-validator";

export enum ValidTopics {
  Politics = "Politics",
  Health = "Health",
  Sport = "Sport",
  Tech = "Tech",
}

// 1. Create an interface representing a document in MongoDB.
interface IPOST {
  _id: mongoose.Types.ObjectId;
  // Link to the owner account
  ownerId: mongoose.Types.ObjectId;

  // Prevent multiple database calls, keep username on record.
  userName: string;

  // parent ID is empty if the post is root post
  parentId?: mongoose.Types.ObjectId;
  // list of child posts, ie comments
  childIds?: mongoose.Types.ObjectId[];

  // actual content of the post
  content: string;

  // interactions with the post
  likes?: number;
  dislikes?: number;

  // Whether interaction is allowed on the post will be calculated on the fly
  created: Date;

  // multiple topics can be attributed to the post
  topics: ValidTopics[];
}

// 2. Create a Schema corresponding to the document interface.
const PostSchema = new Schema<IPOST>({
  _id: { type: Schema.Types.ObjectId, required: true },
  ownerId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  userName: { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, required: false, default: null, ref: "Post" },
  childIds: { type: [Schema.Types.ObjectId], required: false, default: [], ref: "Post" },
  content: { type: String, required: true },
  likes: { type: Number, required: false, default: 0 },
  dislikes: { type: Number, required: false, default: 0 },
  created: { type: Date, required: true },
  topics: { type: [String], enum: Object.values(ValidTopics), required: true },
});

/* Method on post to calculate on the fly if its active*/
PostSchema.methods.isActive = function () {
  const now = new Date();
  const createdDate: Date = this.created;
  const diffTime = Math.abs(now.valueOf() - createdDate.valueOf());
  const diffHours = diffTime / (1000 * 60 * 60); // convert milliseconds to hours
  return diffHours < 24;
};

// 3. Add a toJson Method, This gets called implicitly
PostSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    // Remove MongoDB _id and __v
    returnedObject.link = `localhost:3000/posts/${returnedObject._id}`;
    returnedObject.user_link = `localhost:3000/users/${returnedObject.ownerId}`;
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.ownerId;

    // Remove parentId if it is null
    if (!returnedObject.parentId) {
      delete returnedObject.parentId;
    }

    // Convert childIds array to a count of comments
    if (returnedObject.childIds && Array.isArray(returnedObject.childIds)) {
      returnedObject.comments = returnedObject.childIds.length;
      delete returnedObject.childIds;
    } else {
      returnedObject.comments = 0;
    }

    // @ts-ignore
    returnedObject.status = document.isActive() ? "Active" : "Inactive";
  },
});

// 4. Create a Model.
export const Post = model<IPOST>("Post", PostSchema);

// === Validators related to Posts ===

/* factory method for type safety */
export function createNewPost(data: IPOST) {
  return new Post(data);
}

export const PostIDParam = () =>
  param("postID")
    .exists()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("invalid PostID porvided");

/* validator for making sure the content of posts works */
export const Content = () =>
  body("content")
    .isString()
    .isLength({ min: 1, max: 512 })
    .withMessage("content should be text between 1 and 512 charaters");

/* validator for making sure users input the correct topic */
export const Topic = () =>
  body("topics")
    .isArray({ min: 1 })
    .withMessage("Topics array must have at least one topic")
    .custom((topics) => {
      return topics.every((topic: ValidTopics) => Object.values(ValidTopics).includes(topic));
    })
    .withMessage("Invalid topic(s) provided");

/* validator for TopicId paramater */
export const TopicParam = () =>
  param("topicID")
    .exists()
    .custom((value) => Object.values(ValidTopics).includes(value))
    .withMessage("Invalid topicID provided");
