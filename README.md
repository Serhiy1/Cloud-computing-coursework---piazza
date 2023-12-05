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
   5. jsonwebtoken - For creating the JSON web tokens

5. Project structure - The folder structure of the project follows industry standards, all code is located in the `src` folder. The Main entry points are in the root of this folder.
   - `./api/routes` subfolder contains specific handlers for the different API endpoints
   - `./models` subfolder contains the types for database / API interaction
   - `./utils` contains utility code and classes

   The `dist` folder contains the transpiled javascript that is run by node.

### Running the app locally. 

## Phase B
### user Authentication

```
POST ${host}/user/signup -> user posts email, username and password to register themseleves on the app
POST ${host}/user/login -> user posts email and password to authenticate themselves and recive a JWT token

GET ${host}/user -> User can see their own public details
GET ${host}/user/${userID} -> User can see the public  details of other users
```


## Phase C
### Developing the restful API

#### API for creating and viewing posts

```
GET ${host}/posts/topics -> return a list of valid topics
GET ${host}/posts/topics/${topicID} -> return a list of all the posts that are not comments matching that topic

GET ${host}/posts -> return a list of all the posts that are not comments without any topic filter
GET ${host}/posts/${postID} -> view a single post and a list of all the comments on it

POST ${host}/posts -> When the user wants to create a new post
POST ${host}/posts/${postID} -> When the user wants to comment on a post

POST ${host}/posts/${postID}/like -> When a user likes a post
POST ${host}/posts/${postID}/dislike -> When a user dislikes a post
```

Note: Which posts a User has liked or disliked a comment a refrence to said comment is stored
in an array on their account

When A user calls a the like endpoint a second time on a post it undoes their previous like
Same Goes for the dislike beahviour
