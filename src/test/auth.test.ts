import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

import { app, connectToDatabase } from "../app/app";
import { tokenInfo } from "../app/utils/auth";

let mongo: MongoMemoryServer;

/* Creating the database for the suite. */
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  connectToDatabase(uri);
});

const email = "example@example.com";
const userName = "testymctestface";
const password = "testP@ssWord1";

describe("Sign up process", () => {
  test("Successful signup flow", async () => {
    const user_info = {
      email: email,
      userName: userName,
      password: password,
    };

    const res = await request(app).post("/user/signup").send(user_info);
    expect(res.statusCode).toBe(201);
    expect(res.body.email).toContain(user_info.email);
    expect(res.body.userName).toContain(user_info.userName);
    expect(res.body.password).not.toBeDefined();
  });

  test("successful jwt token exchange", async () => {
    const user_info = {
      email: email,
      password: password,
    };

    const res = await request(app).post("/user/login").send(user_info);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("auth succeeded");

    // make sure that the token has the correct info
    const decoded = jwt.decode(res.body.token) as tokenInfo;
    expect(decoded.email).toBe(email);
    expect(decoded.username).toBe(userName);
    expect(decoded.id).toBeDefined();
  });
});

test("Signup with duplicate email should fail", async () => {
  const user_info = {
    email: email,
    userName: "anotherUser",
    password: password,
  };

  const res = await request(app).post("/user/signup").send(user_info);
  expect(res.statusCode).toBe(409);
  expect(res.body.message).toContain("Email already in use");
});

test("Signup with duplicate username should fail", async () => {
  const user_info = {
    email: "another@example.com",
    userName: userName,
    password: password,
  };

  const res = await request(app).post("/user/signup").send(user_info);
  expect(res.statusCode).toBe(409);
  expect(res.body.message).toContain("Username already in use");
});

test("Signup with weak password should fail", async () => {
  const weakPassword = "123"; // Example of a weak password
  const user_info = {
    email: "weakpass@example.com",
    userName: "weakPasswordUser",
    password: weakPassword,
  };

  const res = await request(app).post("/user/signup").send(user_info);
  expect(res.statusCode).toBe(400);
  // Array of errors
  expect(res.body.message).toBeInstanceOf(Array);
});

/* Closing database connection after each test. */
afterAll(async () => {
  await mongo.stop();
});
