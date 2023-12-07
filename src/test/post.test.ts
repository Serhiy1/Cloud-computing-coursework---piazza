import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

import { app, connectToDatabase } from "../app/app";
import { createNewUser, Person } from "./utils";

let mongo: MongoMemoryServer;
let user_1: Person;
let user_2: Person;

/* Creating the database for the suite. */
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  connectToDatabase(uri);
  [user_1, user_2] = await Promise.all([createNewUser(app), createNewUser(app)]);
});

describe("successful user interactions", () => {
  let originalPost: request.Response;
  let replyPost: request.Response;

  test("new user posts something", async () => {
    const content = {
      title: "some kind of tech post",
      content: "This is some content about tech",
      topics: ["Tech"],
    };

    originalPost = await request(app).post("/posts").set("Authorization", `Bearer ${user_1.token}`).send(content);
    expect(originalPost.statusCode).toBe(201);
    expect(originalPost.body.title).toBe(content.title);
    console.log(user_1.token_info?.id);

    // user information is correct
    expect(originalPost.body.user_link).toContain(user_1.token_info?.id);
    expect(originalPost.body.userName).toBe(user_1.userName);

    // post information
    expect(originalPost.body.post_type).toBe("Post");
    expect(originalPost.body.status).toBe("Live");
    expect(originalPost.body.comments).toBe(0);

    console.log(originalPost.body);
  });

  test("another user responds to the post", async () => {
    const content = {
      content: "This is a comment on the tech post",
    };

    replyPost = await request(app)
      .post(originalPost.body.link)
      .set("Authorization", `Bearer ${user_2.token}`)
      .send(content);
    expect(originalPost.statusCode).toBe(201);

    // make sure the comment information is correct
    expect(replyPost.body.user_link).toContain(user_2.token_info?.id);
    expect(replyPost.body.post_type).toBe("comment");
    expect(replyPost.body.status).toBe("Live");

    // get the original post and make sure that the
    const updated = await request(app).get(originalPost.body.link).set("Authorization", `Bearer ${user_2.token}`);
    expect(updated.body.post.comments).toBe(1);
    expect(updated.body.comments[0].link).toBe(replyPost.body.link);
  });
  test("user_2 dislikes user_1's post, then likes it", async () => {
    // user_2 dislikes user_1's post
    let res = await request(app)
      .post(`${originalPost.body.link}/dislike`)
      .set("Authorization", `Bearer ${user_2.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.dislikes).toBe(1);

    // user_2 changes their mind and likes the post
    res = await request(app).post(`${originalPost.body.link}/like`).set("Authorization", `Bearer ${user_2.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.dislikes).toBe(0);
    expect(res.body.likes).toBe(0);
  });

  test("user_1 likes user_2's reply post, then likes it again", async () => {
    // user_1 likes user_2's reply post
    let res = await request(app).post(`${replyPost.body.link}/like`).set("Authorization", `Bearer ${user_1.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.likes).toBe(1);

    // user_1 likes the post again (toggle like)
    res = await request(app).post(`${replyPost.body.link}/like`).set("Authorization", `Bearer ${user_1.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.likes).toBe(0);
  });

  test("User 2 makes a post under 'Health' topic and verifies topic filter", async () => {
    const healthPost = {
      title: "Health Matters",
      content: "Discussing health and wellness",
      topics: ["Health"],
    };

    // User 2 creates a post
    let res = await request(app).post("/posts").set("Authorization", `Bearer ${user_2.token}`).send(healthPost);
    expect(res.statusCode).toBe(201);

    // Verify the post under 'Health' topic
    res = await request(app).get("/posts/topics/Health").set("Authorization", `Bearer ${user_2.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);

    // original post under 'Tech' topic
    res = await request(app).get("/posts/topics/Tech").set("Authorization", `Bearer ${user_2.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test("/posts endpoint returns all three posts", async () => {
    // Verify the post under 'Health' topic
    const res = await request(app).get("/posts").set("Authorization", `Bearer ${user_2.token}`);
    expect(res.statusCode).toBe(200);
    console.log(res.body);
    expect(res.body).toHaveLength(3);
  });
});

test("Unauthenticated user receives a 403 when listing posts", async () => {
  const res = await request(app).get("/posts");
  expect(res.statusCode).toBe(403);
});

test("User receives a 404 response when responding to a non-existent post", async () => {
  const nonExistentPostId = "656630e3b5e9e0248afec35f";
  const res = await request(app)
    .post(`/posts/${nonExistentPostId}`)
    .set("Authorization", `Bearer ${user_1.token}`)
    .send({ content: "This is a comment" });
  expect(res.statusCode).toBe(404);
});

describe("Post creation validation", () => {
  test("User receives a 400 response for invalid topic", async () => {
    const invalidPost = {
      title: "Topic Post",
      content: "Content here",
      topics: ["InvalidTopic"],
    };

    const res = await request(app).post("/posts").set("Authorization", `Bearer ${user_1.token}`).send(invalidPost);
    expect(res.statusCode).toBe(400);
  });

  test("User receives a 400 response for missing title", async () => {
    const postWithoutTitle = {
      content: "Content here",
      topics: ["Health"],
    };

    const res = await request(app).post("/posts").set("Authorization", `Bearer ${user_1.token}`).send(postWithoutTitle);
    expect(res.statusCode).toBe(400);
  });

  test("User receives a 400 response for missing content", async () => {
    const postWithoutContent = {
      title: "Title here",
      topics: ["Health"],
    };

    const res = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${user_1.token}`)
      .send(postWithoutContent);
    expect(res.statusCode).toBe(400);
  });
});

/* Closing database connection after each test. */
afterAll(async () => {
  await mongo.stop();
});
