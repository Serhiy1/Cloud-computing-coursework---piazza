import http from "http";

import request from "supertest";
import {app, connectToDatabase} from "../app/app";
import { beforeAll, afterAll, describe, it, expect} from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';

var mongo : MongoMemoryServer

/* Creating the database for the suite. */
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  connectToDatabase(uri)

});

describe("Sign up process", () => {
  it("posting /users/signup should succeed", async () => {

    const user_info = {
      "email" : "example@example.com",
      "username" : "testymctestface",
      "password" : "testP@ssWord1"
    }


    const res = await request(app).post("/users/signup").send(user_info)
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});


/* Closing database connection after each test. */
afterAll(async () => {
  await mongo.stop();
});
