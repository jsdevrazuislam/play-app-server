import cookie from "cookie";
import jwt from "jsonwebtoken";
import { SocketEventEnum } from "../constants.js";
import { User } from "../models/user.models.js";

const initializeSocketIO = (io) => {
  return io.on("connection", async (socket) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
      let token = cookies.accessToken;
      if (!token) token = socket.handshake.auth?.token;

      let user = null;

      if (token) {
        try {
          const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
          user = await User.findById(decodedToken?._id).select("-password -refreshToken");

          if (!user) throw new Error("Token is invalid");

          socket.user = user;
          socket.join(user._id.toString());
          console.log(`Authenticated user connected userId: ${user._id.toString()}`);
        } catch (error) {
          console.log("Invalid token provided:", error.message);
        }
      }

      if (user) {
        socket.emit(SocketEventEnum.SOCKET_CONNECTED, "Authenticated Socket Connected");
      } else {
        socket.emit(SocketEventEnum.SOCKET_CONNECTED, "Unauthenticated Socket Connected");
        console.log("Unauthenticated user connected");
      }

      socket.on(SocketEventEnum.JOIN_COMMENT, (videoId) => {
        console.log(`User joined the video comment room. VideoId: ${videoId}`);
        socket.join(`video_${videoId}`);
      });
      socket.on(SocketEventEnum.JOIN_NOTIFICATION, (notificationId) => {
        console.log(`User joined the notification room. Notification: ${notificationId}`);
        socket.join(`notification_${notificationId}`);
      });

      socket.on(SocketEventEnum.SOCKET_DISCONNECTED, () => {
        console.log(`User has disconnected userId: ${socket.user?._id}`);
        if (socket.user?._id) socket.leave(socket.user._id);
      });

    } catch (error) {
      socket.emit(
        SocketEventEnum.SOCKET_ERROR,
        error?.message || "Something went wrong while connecting to the socket"
      );
    }
  });
};


const emitSocketEvent = (req, eventListingId, event, payload) => {
  req.app.get("io").to(eventListingId).emit(event, payload);
};

export { initializeSocketIO, emitSocketEvent };
