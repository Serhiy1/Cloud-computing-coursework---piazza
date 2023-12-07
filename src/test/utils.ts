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
    this.password = faker.internet.password({ length: 8, prefix: "@1T_" });
    this.token = "";
    this.token_info;
  }

  public async signUp() {
    const user_info = {
      email: this.email,
      userName: this.userName,
      password: this.password,
    };
    await request(this.app).post("/user/signup").send(user_info);

    const signInInfo = {
      email: this.email,
      password: this.password,
    };
    const res = await request(this.app).post("/user/login").send(signInInfo);
    this.token = res.body.token as string;
  }
}

export async function createNewUser(app: Express) {
  const user = new Person(app);
  await user.signUp();
  user.token_info = jwt.decode(user.token) as tokenInfo;
  return user;
}
