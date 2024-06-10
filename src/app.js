import express, { json, urlencoded } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import { DATA_LIMIT } from "./constants.js";
import swaggerUi from "swagger-ui-express";
import { avoidInProduction, verifyJWT } from "./middlewares/auth.middleware.js";
import ApiError from "./utils/ApiError.js";
import swaggerDocument from "../swagger.output.json" assert { type: "json" };
import { rateLimit } from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import { initializeSocketIO } from "./socket/index.js";

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  pingTimeout: 60000,
  cors: {
    origin: [process.env.ORIGIN_URL, "http://localhost:5173"],
    credentials: true,
  },
});

app.set("io", io);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_, __, ___, options) => {
    throw new ApiError(
      options.statusCode || 500,
      `There are too many requests. You are only allowed ${
        options.max
      } requests per ${options.windowMs / 60000} minutes`
    );
  },
});

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
app.use(limiter);
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  cors({
    origin: [process.env.ORIGIN_URL, "http://localhost:5173"],
    credentials: true,
  })
);

app.use(
  "/api-docs",
  verifyJWT,
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

// Import Routes
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import likeRouter from "./routes/like.routes.js";
import commentRouter from "./routes/comment.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import { getGeneratedCredentials, seedUsers } from "./seeds/users.seeds.js";
import { getGeneratedVideos, videoSeeds } from "./seeds/videos.seeds.js";

// Routes Middle
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/notifications", notificationRouter);

app.post("/api/v1/seed/created-credentials", avoidInProduction, seedUsers);
app.get(
  "/api/v1/seed/generated-credentials",
  avoidInProduction,
  getGeneratedCredentials
);
app.post(
  "/api/v1/seed/created-videos",
  avoidInProduction,
  verifyJWT,
  videoSeeds
);
app.get("/api/v1/seed/generated-videos", avoidInProduction, getGeneratedVideos);

initializeSocketIO(io);

app.get("*", (_, res) => {
  res.status(404).json({
    message: "Oops! The page you are looking for does not exist.",
    documentation: "You can find the API documentation at /api-docs.",
  });
});

app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(err.toJSON());
  } else {
    res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
      success: false,
      errors: [],
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

export { httpServer };
