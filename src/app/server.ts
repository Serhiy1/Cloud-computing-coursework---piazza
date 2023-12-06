import http from "http";

import { app, connectToDatabase } from "./app";
import { GetEnvValue } from "./utils/utils";

const connectionString = GetEnvValue("MongoConnectionString");
connectToDatabase(connectionString)

const port = process.env.PORT || 3001;

const server = http.createServer(app);

server.listen(port);
