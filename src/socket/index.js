import cookie from "cookie";
import jwt from "jsonwebtoken";
import { SocketEventEnum } from "../constants.js";
import { User } from "../models/user.models.js";

// Reusable function to handle socket events and join rooms
const joinRoom = (socket, eventEnum, roomPrefix) => {
  socket.on(eventEnum, (id) => {
    console.log(`User joined the ${roomPrefix} room. ${roomPrefix}Id: ${id}`);
    socket.join(`${roomPrefix}_${id}`);
  });
};

// Usage of the reusable function for each specific event
const setupSocketListeners = (socket) => {
  joinRoom(socket, SocketEventEnum.JOIN_VIDEO, "video");
  joinRoom(socket, SocketEventEnum.JOIN_CHANNEL, "channel");
  joinRoom(socket, SocketEventEnum.JOIN_NOTIFICATION, "notification");
  // joinRoom(socket, SocketEventEnum.JOIN_LIKE, "like");
  // joinRoom(socket, SocketEventEnum.JOIN_DISLIKE, "dislike");
  // joinRoom(socket, SocketEventEnum.JOIN_DISLIKE, "remove_reaction");
};

const initializeSocketIO = (io) => {
  return io.on("connection", async (socket) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
      let token = cookies.accessToken;
      if (!token) token = socket.handshake.auth?.token;

      let user = null;

      if (token) {
        try {
          const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
          );
          user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
          );

          if (!user) throw new Error("Token is invalid");

          socket.user = user;
          socket.join(user._id.toString());
          console.log(
            `Authenticated user connected userId: ${user._id.toString()}`
          );
        } catch (error) {
          console.log("Invalid token provided:", error.message);
        }
      }

      if (user) {
        socket.emit(
          SocketEventEnum.SOCKET_CONNECTED,
          "Authenticated Socket Connected"
        );
      } else {
        socket.emit(
          SocketEventEnum.SOCKET_CONNECTED,
          "Unauthenticated Socket Connected"
        );
        console.log("Unauthenticated user connected");
      }

      setupSocketListeners(socket);

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
