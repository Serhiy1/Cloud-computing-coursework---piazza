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
   1. body-parser - For de-serialisng JSON objects
   2. morgan - Logging middle ware for express JS
   3. Mongoose - For interacting with a mongo DB libaray

5. Project structure - The folder structure of the project follows industry standards, all code is located in the `src` folder. The Main entry points are in the root of this folder.
   - `./api/routes` subfolder contains specific handlers for the different API endpoints
   - `./models` subfolder contains the types for database / API interaction
   - `./utils` contains utility code and classes

   The `dist` folder contains the transpiled javascript that node runs. 


