import { afterAll, beforeAll, describe, expect, test, jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

import { app, connectToDatabase } from "../app/app";
import { createNewUser, Person } from "./utils";
import * as utils from "../app/utils/utils";

let mongo: MongoMemoryServer;
let Olga: Person;
let Nicky: Person;
let Mary: Person;
let Nestor: Person;

/* Creating the database for the suite. */
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  connectToDatabase(uri);
  // TC 1: Olga, Nick, Mary, and Nestor register
  // TC 2: Olga, Nick, Mary, and Nestor get their tokens
  // NB: for auth specific tests see `auth.test.ts`
  [Olga, Nicky, Mary, Nestor] = await Promise.all([
    createNewUser(app),
    createNewUser(app),
    createNewUser(app),
    createNewUser(app),
  ]);
});

// This mock Will cause all posts to expire in 5 minutes
jest.spyOn(utils, "GetExpiryDate").mockImplementation(() => {
  const currentDate = new Date();
  return new Date(currentDate.setMinutes(currentDate.getMinutes() - 5));
});

describe("Piazza API Tests", () => {
  // TC 3: Olga makes an unauthorized API call
  test("TC 3: Olga makes an unauthorized API call", async () => {
    // Simulate an API call without a token and check for failure
  });

  // TC 4: Olga posts a message in the Tech topic
  test("TC 4: Olga posts a message in the Tech topic", async () => {
    // Simulate Olga posting a message in the Tech topic
  });

  // TC 5: Nick posts a message in the Tech topic
  test("TC 5: Nick posts a message in the Tech topic", async () => {
    // Simulate Nick posting a message in the Tech topic
  });

  // TC 6: Mary posts a message in the Tech topic
  test("TC 6: Mary posts a message in the Tech topic", async () => {
    // Simulate Mary posting a message in the Tech topic
  });

  // TC 7: Nick and Olga browse all available posts in the Tech topic
  test("TC 7: Nick and Olga browse all available posts in the Tech topic", async () => {
    // Simulate Nick and Olga browsing posts in the Tech topic
  });

  // TC 8: Nick and Olga “like” Mary's post
  test("TC 8: Nick and Olga “like” Mary's post", async () => {
    // Simulate Nick and Olga liking Mary's post
  });

  // TC 9: Nestor “likes” Nick's post and “dislikes” Mary's
  test("TC 9: Nestor “likes” Nick's post and “dislikes” Mary's", async () => {
    // Simulate Nestor liking Nick's and disliking Mary's posts
  });

  // TC 10: Nick browses all available posts on the Tech topic
  test("TC 10: Nick browses all available posts on the Tech topic", async () => {
    // Simulate Nick browsing all posts in the Tech topic
  });

  // TC 11: Mary tries to like her own post
  test("TC 11: Mary likes her own post", async () => {
    // Simulate Mary trying to like her own post and expecting failure
  });

  // TC 12: Nick and Olga comment on Mary's post
  test("TC 12: Nick and Olga comment on Mary's post", async () => {
    // Simulate Nick and Olga commenting on Mary's post
  });

  // TC 13: Nick browses all available posts with comments in the Tech topic
  test("TC 13: Nick browses all available posts in the Tech topic", async () => {
    // Simulate Nick browsing all posts with comments in the Tech topic
  });

  // TC 14: Nestor posts a message in the Health topic
  test("TC 14: Nestor posts a message in the Health topic", async () => {
    // Simulate Nestor posting a message in the Health topic
  });

  // TC 15: Mary browses all available posts on the Health topic
  test("TC 15: Mary browses all available posts on the Health topic", async () => {
    // Simulate Mary browsing posts in the Health topic
  });

  // TC 16: Mary posts a comment on Nestor's message in the Health topic
  test("TC 16: Mary posts a comment in Nestor's message on the Health topic", async () => {
    // Simulate Mary posting a comment on Nestor's message
  });

  // TC 17: Mary dislikes Nestor's post after expiration
  test("TC 17: Mary dislikes Nestor's message on the Health topic after expiration", async () => {
    // Simulate Mary trying to dislike Nestor's post after its expiration
  });

  // TC 18: Nestor browses all messages on the Health topic
  test("TC 18: Nestor browses all messages on the Health topic", async () => {
    // Simulate Nestor browsing all messages in the Health topic
  });

  //TC 19. Nick browses all the expired messages on the Sports topic.
  test("TC 19. Nick browses all the expired messages on the Sports topic", async () => {
    // These should be empty
  });

  //TC 20. Nestor queries for an active post with the highest interest
  test("TC 20. Nestor queries for an active post with the highest interest ", async () => {
    // (maximum number of likes and dislikes) in the Tech topic. This should be Mary’s post.
  });
});

/* Closing database connection after each test. */
afterAll(async () => {
  await mongo.stop();
});
