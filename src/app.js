import express, { json, urlencoded } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import { DATA_LIMIT } from "./constants.js";
import { swagger } from "../swagger.js";


const app = express();

app.use(
  json({
    limit: DATA_LIMIT,
  })
);
app.use(
  urlencoded({
    extended: true,
    limit: DATA_LIMIT,
  })
);
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.ORIGIN_URL,
    credentials: true,
  })
);

swagger(app)

// Import Routes
import userRouter from './routes/user.routes.js';
import videoRouter from "./routes/video.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import likeRouter from "./routes/like.routes.js"
import commentRouter from "./routes/comment.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"






// Routes Middle
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)










export default app;
