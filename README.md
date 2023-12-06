## Phase A
### Install and deploy software in virtualised environments

1. The development environment uses a VS code [development container](https://code.visualstudio.com/learn/develop-cloud/containers).
   - The development container is based of the default nodeJs Docker image
   - The image used for the dev container can be re-used for deploying the service to the cloud
   - The dev container is set to install a set of default VS code pligins:
      1. thunder-client, a postMan Clone that is present inside VS code
      2. Spell checker
      3. Mongo DB plugin for connecting and debugging the database

2. Setting up typescript compilation and default packages
   - This guide was used for getting node, express and typescript to work with each other https://blog.logrocket.com/how-to-set-up-node-typescript-express/
   - Typescript was selected due to the advantages that type checking and autocomplete provides with reducing bugs and speeding up development with autocomplete

3. setup Linting and formatting configurations
   - Eslint and prettier were selected as they are the industry defaults

4. Selecting packages and plugins for the project
   1. morgan - Logging middle ware for express JS
   2. Mongoose - For interacting with the mongo data base
   3. express-validator - validating user input
   4. bycrypt - hashing passwords so they are not stored as plain text
   5. jsonwebtoken - For creating the JSON web tokens for oauth

5. Project structure - The folder structure of the project follows industry standards, all code is located in the `src` folder. The Main entry points are in the root of this folder.
    - `./app/api/routes` subfolder contains specific handlers for the different API endpoints
    - `./app/models` subfolder contains the types for database / API interaction
    - `./app/utils` contains utility code and classes
    - `./testing` Contains all the test code

    The `dist` folder contains the transpiled javascript that is run by node.

6. Selecting the test setup
    - Adhoc testing during the development is done with the postman clone thunder client
    - The `jest`, `supertest`, `cross-env` packages are used for the structured testing. These where selected as recommendations from the following [guide](https://www.freecodecamp.org/news/how-to-test-in-express-and-mongoose-apps/).
    - The guide was modified with the use of `mongodb-memory-server`

### Running the app locally.

1. Open the project in VS code
2. Copy `.env-empty-copy` and rename it to `.env`. Add all the secure details for th deployment
3. Install the remote development extension for VS code
4. Re-open the project inside the development container - This should start the docker image and attach VS code to it.
5. run `npm run dev` to start the dev server


## Phase B
### user Authentication

**API Paths**
```
POST ${host}/user/signup -> user posts email, username and password to register themselves on the app
POST ${host}/user/login -> user posts email and password to authenticate themselves and receive a JWT token

GET ${host}/user -> User can see their own public details
GET ${host}/user/${userID} -> User can see the public details of other users

```

**When Signing up the following payload needs to be sent**
```
{
  "email": "${email}",
  "password" : "${password}",
  "userName" : "${username}"
}
```

A 200 response containing the Public view of the User is returned when signing up
A 409 response is returned if an email or username is already in use
A 400 response is returned if any of the fields are missing
A 400 response is returned if the password complexity is not met: 8 char min, 1 capital, 1 number, 1 symbol

**When logging in the following payload needs to be sent**
```
{
  "email": "${email}",
  "password" : "${password}"
}
```
A 400 response is returns if any of the fields are missing
A 403 response is returned when the username or password does not match
A 200 response is returned when successfully logging in `{message: "auth succeeded", "token" : "${jwt token}"}`

**when Viewing a user or yourself**

A 400 response is returned when the user ID does not exist

When A user is successfully found the returned format is
```
{
  "user": {
    "userName": "${username}",
    "email": "${email}",
    "likedComments": [
      ${mongo ID}
    ],
    "diLikedComments": [
      ${mongo ID}
    ]
  },
  "posts": [
    {
      ${Post JSON}
    }
  ],
  "comments": [
    {
      ${Post JSON}
    }

  ]
}
```


## Phase C
### Developing the restful API

#### API for creating and viewing posts

**Global Rules**
- User cannot like, dislike or comment on post that is marked as expired
- All Posts go expired depending on the `expiredTimeHours` environment variable
   - When attempting to interact with an expired comment as 400 response is returned

- All API endpoints on /post require a jwt token from the /login endpoint
   - When attempting to interact without a token a 403 response is returned

- All posts require atlas one topic entry in `"politics", "Health", "sport", "Tech"`

**Liking, disliking and commenting on Posts**

- when a person likes a post that they have already disliked it un-does the dislike and vice versa
- When a person likes/dislikes a post a second time it un-does the first action
- When a person creates a Post the parent field is hidden
- When a person comments on a Post the parentId field is present
  - The comment count of the parent should also increase

- When Listing posts on a topic or globally, the comments are compressed into a count. To view individual comments you need to specifically `GET` a post

**post JSON Response**
```
{
  "title" : "${title}"
  "userName": "${username}",
  "content": "this post is about some tech",
  "likes": 0,
  "dislikes": 0,
  "created": "2023-12-05T15:06:58.468Z",
  "topics": ["Tech"],
  "link": "${host}/posts/${mongo ID}",
  "user_link": "${host}/users/${mongo ID}",
  "post_type": "Post",  # or Comment
  "comments": 1,
  "status": "Active" # or "inactive"
  "Expires_in" : "1 hour"
}
```
**When creating a post the user needs to post**
```
{
  "title" : "${title}"
  "content" : "${content}",
  "topics" : [${valid topic}]
}

```

**When a user wants to comment on a post**
```
{
  "content" : "${content}",
}

```

**API Paths**
```
GET ${host}/posts/topics -> return a list of valid topics
GET ${host}/posts/topics/${topicID} -> return a list of all the live posts that are not comments matching that topic
GET ${host}/posts/topics/${topicID}/expired -> return a list of all the expired posts that are not comments matching that topic


GET ${host}/posts -> return a list of all the live posts that are not comments without any topic filter
GET ${host}/posts -> return a list of all the expired posts that are not comments without any topic filter
GET ${host}/posts/${postID} -> view a single post and a list of all the comments on it

POST ${host}/posts -> When the user wants to create a new post
POST ${host}/posts/${postID} -> When the user wants to comment on a post

POST ${host}/posts/${postID}/like -> When a user likes a post
POST ${host}/posts/${postID}/dislike -> When a user dislikes a post

```