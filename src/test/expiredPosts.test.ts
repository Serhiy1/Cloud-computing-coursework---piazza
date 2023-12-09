import { afterAll, beforeAll, describe, expect, test, jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

import { app, connectToDatabase } from "../app/app";
import { createNewUser, Person } from "./utils";
import * as utils from "../app/utils/utils";

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

// This mock Will cause all posts to be immediately expired
jest.spyOn(utils, "GetExpiryDate").mockImplementation(() => new Date());

describe("Expired Posts Suite", () => {
  let originalPost: request.Response;

  test("Create an Expired Post", async () => {
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
    expect(originalPost.body.comments).toBe(0);
  });

  test("User Gets an expired post", async () => {
    // Make it that posts will always report as expired
    const updated = await request(app).get(originalPost.body.link).set("Authorization", `Bearer ${user_2.token}`);
    expect(originalPost.body.status).toBe("Expired");
  });

  test("User tries to reply to the expired post", async () => {
    const replyContent = {
      content: "This is a reply to the expired post",
    };

    const replyResponse = await request(app)
      .post(`${originalPost.body.link}`)
      .set("Authorization", `Bearer ${user_2.token}`)
      .send(replyContent);

    expect(replyResponse.statusCode).toBe(400);
    expect(replyResponse.body.message).toContain("expired");
  });

  test("User tries to like the expired post", async () => {
    const likeResponse = await request(app)
      .post(`${originalPost.body.link}/like`)
      .set("Authorization", `Bearer ${user_2.token}`);

    expect(likeResponse.statusCode).toBe(400);
    expect(likeResponse.body.message).toContain("expired");
  });

  test("User tries to dislike the expired post", async () => {
    const dislikeResponse = await request(app)
      .post(`${originalPost.body.link}/dislike`)
      .set("Authorization", `Bearer ${user_2.token}`);

    expect(dislikeResponse.statusCode).toBe(400);
    expect(dislikeResponse.body.message).toContain("expired");
  });

  test("User lists all active posts", async () => {
    const response = await request(app).get("/posts").set("Authorization", `Bearer ${user_2.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(0); // Expecting an empty array for active posts
  });

  test("User lists expired posts", async () => {
    const response = await request(app).get("/posts/expired").set("Authorization", `Bearer ${user_2.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0); // Expecting non-empty array for expired posts
  });
});

/* Closing database connection at the end of the suite. */
afterAll(async () => {
  await mongo.stop();
});
