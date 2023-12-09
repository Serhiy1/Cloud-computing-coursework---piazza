import { afterAll, beforeAll, describe, expect, test, jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

import { app, connectToDatabase } from "../app/app";
import { createNewUser, Person, waitForExpiry } from "./utils";
import * as utils from "../app/utils/utils";

let mongo: MongoMemoryServer;
let Olga: Person;
let Nick: Person;
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
  [Olga, Nick, Mary, Nestor] = await Promise.all([
    createNewUser(app),
    createNewUser(app),
    createNewUser(app),
    createNewUser(app),
  ]);
});

// This mock Will cause all posts to expire in 7 Seconds
jest.spyOn(utils, "GetExpiryDate").mockImplementation(() => {
  const currentDate = new Date();
  return new Date(currentDate.setSeconds(currentDate.getSeconds() - 7));
});

describe("Piazza API Tests", () => {
  let OlgaPost: request.Response;
  let NickPost: request.Response;
  let MaryPost: request.Response;
  let NestorPost: request.Response;

  test("TC 3: Olga makes an unauthorized API call", async () => {
    const res = await request(app).get("/posts");
    expect(res.statusCode).toBe(403);
  });

  test("TC 4: Olga posts a message in the Tech topic", async () => {
    const content = {
      title: "Olga's tech post",
      content: "This is some content about tech",
      topics: ["Tech"],
    };

    OlgaPost = await request(app).post("/posts").set("Authorization", `Bearer ${Olga.token}`).send(content);
    expect(OlgaPost.statusCode).toBe(201);
    expect(OlgaPost.body.title).toBe(content.title);

    // user information is correct
    expect(OlgaPost.body.user_link).toContain(Olga.token_info?.id);
    expect(OlgaPost.body.userName).toBe(Olga.userName);

    // post information
    expect(OlgaPost.body.post_type).toBe("Post");
    expect(OlgaPost.body.status).toBe("Live");
    expect(OlgaPost.body.comments).toBe(0);
  });

  test("TC 5: Nick posts a message in the Tech topic", async () => {
    const content = {
      title: "Nick's tech post",
      content: "This is a second post about tech",
      topics: ["Tech"],
    };

    NickPost = await request(app).post("/posts").set("Authorization", `Bearer ${Nick.token}`).send(content);
    expect(NickPost.statusCode).toBe(201);
    expect(NickPost.body.title).toBe(content.title);

    // user information is correct
    expect(NickPost.body.user_link).toContain(Nick.token_info?.id);
    expect(NickPost.body.userName).toBe(Nick.userName);

    // post information
    expect(NickPost.body.post_type).toBe("Post");
    expect(NickPost.body.status).toBe("Live");
    expect(NickPost.body.comments).toBe(0);
  });

  test("TC 6: Mary posts a message in the Tech topic", async () => {
    const content = {
      title: "Mary's tech post",
      content: "This is a third post about tech",
      topics: ["Tech"],
    };

    MaryPost = await request(app).post("/posts").set("Authorization", `Bearer ${Mary.token}`).send(content);
    expect(MaryPost.statusCode).toBe(201);
    expect(MaryPost.body.title).toBe(content.title);

    // user information is correct
    expect(MaryPost.body.user_link).toContain(Mary.token_info?.id);
    expect(MaryPost.body.userName).toBe(Mary.userName);

    // post information
    expect(MaryPost.body.post_type).toBe("Post");
    expect(MaryPost.body.status).toBe("Live");
    expect(MaryPost.body.comments).toBe(0);
  });

  test("TC 7: Nick and Olga browse all available posts in the Tech topic", async () => {
    // three posts should be available with zero likes, zero dislikes and no comments
    const OlgaList = await request(app).get("/posts/topics/Tech").set("Authorization", `Bearer ${Olga.token}`);
    const MaryList = await request(app).get("/posts/topics/Tech").set("Authorization", `Bearer ${Mary.token}`);
    const NickList = await request(app).get("/posts/topics/Tech").set("Authorization", `Bearer ${Nick.token}`);

    // Get all the post links into an array
    const OlgaTopicList = OlgaList.body.map(
      (item: { link: string; likes: number; dislikes: number; comments: number }) => {
        return [item.link, item.likes, item.dislikes, item.comments];
      }
    );
    const MaryTopicList = MaryList.body.map(
      (item: { link: string; likes: number; dislikes: number; comments: number }) => {
        return [item.link, item.likes, item.dislikes, item.comments];
      }
    );
    const NickTopicList = NickList.body.map(
      (item: { link: string; likes: number; dislikes: number; comments: number }) => {
        return [item.link, item.likes, item.dislikes, item.comments];
      }
    );

    // Assert that everyone is seeing the same three posts
    expect(OlgaTopicList).toEqual(MaryTopicList);
    expect(OlgaTopicList).toEqual(NickTopicList);
    expect(NickTopicList).toEqual(MaryTopicList);

    // assert that everyone sees 0 likes, 0 dislikes and 0 comments
    const NoInteractions: number[][] = Array(3)
      .fill(null)
      .map(() => [0, 0, 0]);
    expect(
      OlgaTopicList.map((item: []) => {
        return item.slice(1);
      })
    ).toEqual(NoInteractions);
    expect(
      OlgaTopicList.map((item: []) => {
        return item.slice(1);
      })
    ).toEqual(NoInteractions);
    expect(
      NickTopicList.map((item: []) => {
        return item.slice(1);
      })
    ).toEqual(NoInteractions);
  });

  test("TC 8: Nick and Olga “like” Mary's post", async () => {
    const NickLike = await request(app).post(`${MaryPost.body.link}/like`).set("Authorization", `Bearer ${Nick.token}`);
    expect(NickLike.statusCode).toBe(200);
    expect(NickLike.body.likes).toBe(1);

    const OlgaLike = await request(app).post(`${MaryPost.body.link}/like`).set("Authorization", `Bearer ${Olga.token}`);
    expect(OlgaLike.statusCode).toBe(200);
    expect(OlgaLike.body.likes).toBe(2);
  });

  test("TC 9: Nestor “likes” Nick's post and “dislikes” Mary's", async () => {
    const NestorLike = await request(app)
      .post(`${NickPost.body.link}/like`)
      .set("Authorization", `Bearer ${Nestor.token}`);
    expect(NestorLike.statusCode).toBe(200);
    expect(NestorLike.body.likes).toBe(1);

    const NestorDislike = await request(app)
      .post(`${MaryPost.body.link}/dislike`)
      .set("Authorization", `Bearer ${Nestor.token}`);
    expect(NestorDislike.statusCode).toBe(200);
    expect(NestorDislike.body.likes).toBe(2);
    expect(NestorDislike.body.dislikes).toBe(1);
  });

  test("TC 10: Nick browses all available posts on the Tech topic", async () => {
    // at this stage, he can see the number of likes and dislikes for each post
    // (Mary has two likes and one dislike, and Nick has one like). There are no comments
    // made yet.

    const NickList = await request(app).get("/posts/topics/Tech").set("Authorization", `Bearer ${Nick.token}`);
    const NickTopicList = NickList.body.map((item: { likes: number; dislikes: number; comments: number }) => {
      return [item.likes, item.dislikes, item.comments];
    });

    // 2 likes, 1 dislike, 0 comments
    const MaryPostStats = [2, 1, 0];
    // 1 like, 0 dislike, 0 comments
    const nickPostStats = [1, 0, 0];
    // 0 like, 0 dislike, 0 comments
    const OlgaPostStats = [0, 0, 0];

    expect(NickTopicList).toEqual([OlgaPostStats, nickPostStats, MaryPostStats]);
  });

  test("TC 11: Mary likes her own post", async () => {
    // This call should be unsuccessful; in Piazza, a post owner cannot like their messages.
    const marySelfLike = await request(app)
      .post(`${MaryPost.body.link}/like`)
      .set("Authorization", `Bearer ${Mary.token}`);
    expect(marySelfLike.statusCode).toBe(400);
  });

  test("TC 12: Nick and Olga comment on Mary's post", async () => {
    // in a round-robin fashion (one after the other, adding at least two comments each).

    const NickComment1 = { content: "this is Nicks First comment" };
    const OlgaComment1 = { content: "this is Olga's First comment" };

    const NickComment2 = { content: "this is Nicks Second comment" };
    const OlgaComment2 = { content: "this is Olga's Second comment" };

    const req1 = await request(app)
      .post(`${MaryPost.body.link}`)
      .set("Authorization", `Bearer ${Nick.token}`)
      .send(NickComment1);
    expect(req1.statusCode).toBe(201);
    const req2 = await request(app)
      .post(`${MaryPost.body.link}`)
      .set("Authorization", `Bearer ${Olga.token}`)
      .send(OlgaComment1);
    expect(req2.statusCode).toBe(201);
    const req3 = await request(app)
      .post(`${MaryPost.body.link}`)
      .set("Authorization", `Bearer ${Nick.token}`)
      .send(NickComment2);
    expect(req3.statusCode).toBe(201);
    const req4 = await request(app)
      .post(`${MaryPost.body.link}`)
      .set("Authorization", `Bearer ${Olga.token}`)
      .send(OlgaComment2);
    expect(req4.statusCode).toBe(201);
  });

  test("TC 13: Nick browses all available posts in the Tech topic", async () => {
    const NickList = await request(app).get("/posts/topics/Tech").set("Authorization", `Bearer ${Nick.token}`);
    const UpdatedMaryPost = NickList.body.find((post: { link: string }) => post.link === MaryPost.body.link);
    expect(UpdatedMaryPost.comments).toBe(4);
  });

  test("TC 14: Nestor posts a message in the Health topic", async () => {
    const content = {
      title: "Nestor's health post",
      content: "This is a post about health",
      topics: ["Health"],
    };

    NestorPost = await request(app).post("/posts").set("Authorization", `Bearer ${Nestor.token}`).send(content);
    expect(NestorPost.statusCode).toBe(201);

    // user information is correct
    expect(NestorPost.body.user_link).toContain(Nestor.token_info?.id);
    expect(NestorPost.body.userName).toBe(Nestor.userName);

    // post information
    expect(NestorPost.body.post_type).toBe("Post");
    expect(NestorPost.body.status).toBe("Live");
    expect(NestorPost.body.comments).toBe(0);
  });

  test("TC 15: Mary browses all available posts on the Health topic", async () => {
    // Expect to only find nestors post here
    const MaryList = await request(app).get("/posts/topics/Health").set("Authorization", `Bearer ${Mary.token}`);
    expect(MaryList.statusCode).toBe(200);
    expect(MaryList.body).toHaveLength(1);
    expect(MaryList.body[0].link).toBe(NestorPost.body.link);
  });

  test("TC 16: Mary posts a comment in Nestor's message on the Health topic", async () => {
    const comment = { content: "Mary's comment on Nestor's post" };
    const response = await request(app)
      .post(NestorPost.body.link)
      .set("Authorization", `Bearer ${Mary.token}`)
      .send(comment);
    expect(response.statusCode).toBe(201);
    expect(response.body.content).toEqual(comment.content);
  });

  // TC 17 is last, as we are wating for expiry

  test("TC 18: Nestor browses all messages on the Health topic", async () => {
    const NestorList = await request(app).get("/posts/topics/Health").set("Authorization", `Bearer ${Nestor.token}`);
    expect(NestorList.statusCode).toBe(200);
    expect(NestorList.body).toHaveLength(1);
    expect(NestorList.body[0].link).toBe(NestorPost.body.link);
  });

  test("TC 19. Nick browses all the expired messages on the Sports topic", async () => {
    const NickList = await request(app)
      .get("/posts/topics/Sports/expired")
      .set("Authorization", `Bearer ${Nick.token}`);
    expect(NickList.statusCode).toBe(200);
    expect(NickList.body.length).toBe(0);
  });

  test("TC 20. Nestor queries for an active post with the highest interest ", async () => {
    // Nestor sends a GET request to the endpoint with the orderBy query parameter set to 'Activity'
    const response = await request(app).get("/posts?orderBy=Activity").set("Authorization", `Bearer ${Nestor.token}`);

    expect(response.statusCode).toBe(200);

    const posts = response.body;
    expect(posts.length).toBeGreaterThan(0); // Ensure there's at least one post

    // Check if Mary's post is the first one in the response
    const topPost = posts[0];
    expect(topPost.link).toBe(MaryPost.body.link);
  });

  test("TC 17: Mary dislikes Nestor's message on the Health topic after expiration", async () => {
    const postStatus = await waitForExpiry(app, NestorPost.body.link, Mary.token);
    expect(postStatus).toBe("Expired");

    // attempt to dislike the post after its been expired
    const dislikeResponse = await request(app)
      .post(`${NestorPost.body.link}/dislike`)
      .set("Authorization", `Bearer ${Mary.token}`);
    expect(dislikeResponse.statusCode).toBe(400);
  });
});

/* Closing database connection at the end of the suite. */
afterAll(async () => {
  await mongo.stop();
});
