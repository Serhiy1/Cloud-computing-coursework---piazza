import { expect } from "@jest/globals";
import { faker } from "@faker-js/faker";
import { Express } from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { tokenInfo } from "../app/utils/auth";

export class Person {
  app: Express;
  userName: string;
  email: string;
  password: string;
  token: string;
  token_info?: tokenInfo;

  constructor(app: Express) {
    this.app = app;
    this.userName = faker.internet.userName();
    this.email = faker.internet.email();
    this.password = faker.internet.password({ length: 12, prefix: "@1T_" });
    this.token = "";
    this.token_info;
  }

  public async signUp() {
    const user_info = {
      email: this.email,
      userName: this.userName,
      password: this.password,
    };
    var res = await request(this.app).post("/user/signup").send(user_info);
    console.log(res.body);
    expect(res.status).toBe(201);

    const signInInfo = {
      email: this.email,
      password: this.password,
    };
    res = await request(this.app).post("/user/login").send(signInInfo);
    expect(res.status).toBe(200);
    this.token = res.body.token as string;
  }
}

export async function createNewUser(app: Express) {
  const user = new Person(app);
  await user.signUp();
  user.token_info = jwt.decode(user.token) as tokenInfo;
  return user;
}


export const waitForExpiry = async (app: Express, postLink: string, token: string, maxAttempts = 10, pollInterval = 1000) => {
  let postStatus = "";

  // Function to get the current status of the post
  const checkPostStatus = async () => {
    const response = await request(app).get(postLink).set("Authorization", `Bearer ${token}`);
    if (response.statusCode === 200) {
      postStatus = response.body.post.status;
    }
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await checkPostStatus();
    if (postStatus === "Expired") {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  return postStatus;
};