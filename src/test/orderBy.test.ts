import { afterAll, beforeAll, describe, expect, test, jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { Express } from "express";

import { app, connectToDatabase } from "../app/app";
import { createNewUser, Person, waitForExpiry } from "./utils";

let mongo: MongoMemoryServer;
let Olga: Person;
let Nick: Person;
let Mary: Person;
let Nestor: Person;

let OlgaPost: request.Response;
let NickPost: request.Response;
let MaryPost: request.Response;
let NestorPost: request.Response;

function MakePost(title: string) {
  return {
    title: title,
    content: "This is some content about tech",
    topics: ["Tech"],
  };
}

const OlgaTitle = "Olga's Post";
const NickTitle = "Nick's Post";
const MaryTitle = "Mary's Post";
const NestorTitle = "Nestor's Post";

/* Creating the database for the suite. */
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  connectToDatabase(uri);
  // TC 1: Olga, Nick, Mary, and Nestor register
  // TC 2: Olga, Nick, Mary, and Nestor get their tokens
  // NB: for auth specific tests see `auth.test.ts`
  [Olga, Nick, Mary, Nestor] = await Promise.all([
    createNewUser(app),
    createNewUser(app),
    createNewUser(app),
    createNewUser(app),
  ]);

  OlgaPost = await request(app).post("/posts").set("Authorization", `Bearer ${Olga.token}`).send(MakePost(OlgaTitle));
  NickPost = await request(app).post("/posts").set("Authorization", `Bearer ${Nick.token}`).send(MakePost(NickTitle));
  MaryPost = await request(app).post("/posts").set("Authorization", `Bearer ${Mary.token}`).send(MakePost(MaryTitle));
  NestorPost = await request(app)
    .post("/posts")
    .set("Authorization", `Bearer ${Nestor.token}`)
    .send(MakePost(NestorTitle));

  // Olgas post is the most liked 2 likes
  await likePost(app, OlgaPost.body.link, [Nick, Mary]);
  // Nicks post is partially liked with 1 like
  await likePost(app, NickPost.body.link, [Olga]);
  // Marys post is partially disliked with 1 dislike
  await disikePost(app, MaryPost.body.link, [Nick]);
  // nestors post is most contreversial with three dislikes
  await disikePost(app, NestorPost.body.link, [Nick, Olga, Mary]);
});

describe("Check that ordering posts by Likes, dislikes and activity works", () => {
  test("Test default ordering: by age of post", async () => {
    const res = await request(app).get("/posts").set("Authorization", `Bearer ${Nestor.token}`);
    expect(res.status).toBe(200);

    // Check that the posts are in chronological order
    const titles = res.body.map((post: { title: string }) => {
      return post.title;
    });
    expect(titles).toEqual([OlgaTitle, NickTitle, MaryTitle, NestorTitle]);
  });

  test("Test ordering by Likes", async () => {
    const res = await request(app).get("/posts?orderBy=Likes").set("Authorization", `Bearer ${Nestor.token}`);
    expect(res.status).toBe(200);

    // Check that the posts are in chronological order
    const titles = res.body.map((post: { title: string }) => {
      return post.title;
    });
    expect(titles).toEqual([OlgaTitle, NickTitle, MaryTitle, NestorTitle]);
  });

  test("Test ordering by dislikes", async () => {
    const res = await request(app).get("/posts?orderBy=Dislikes").set("Authorization", `Bearer ${Nestor.token}`);
    expect(res.status).toBe(200);

    // Check that the posts are in chronological order
    const titles = res.body.map((post: { title: string }) => {
      return post.title;
    });
    expect(titles).toEqual([NestorTitle, MaryTitle, OlgaTitle, NickTitle]);
  });

  test("Test ordering by Activity", async () => {
    const res = await request(app).get("/posts?orderBy=Activity").set("Authorization", `Bearer ${Nestor.token}`);
    expect(res.status).toBe(200);

    // Check that the posts are in chronological order
    const titles = res.body.map((post: { title: string }) => {
      return post.title;
    });
    expect(titles).toEqual([NestorTitle, OlgaTitle, NickTitle, MaryTitle]);
  });
});

async function likePost(app: Express, post: string, people: Person[]) {
  for (const person of people) {
    const res = await request(app).post(`${post}/like`).set("Authorization", `Bearer ${person.token}`);
    expect(res.status).toBe(200);
  }
}

async function disikePost(app: Express, post: string, people: Person[]) {
  for (const person of people) {
    const res = await request(app).post(`${post}/dislike`).set("Authorization", `Bearer ${person.token}`);
    expect(res.status).toBe(200);
  }
}

/* Closing database connection at the end of the suite. */
afterAll(async () => {
  await mongo.stop();
});
