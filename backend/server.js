const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = require("./src/index");
const { startBookingScheduler } = require("./src/services/bookingScheduler");
const battlesRoutes = require("./src/routes/battles");

/* =================================
   CORS CONFIGURATION
================================= */

const allowedOrigins = [
  "http://localhost:5173",
  "https://thunder-management-six.vercel.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server or Postman requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

/* =================================
   ROUTES
================================= */

app.use("/api/battles", battlesRoutes);

/* =================================
   HTTP SERVER + SOCKET.IO
================================= */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io globally accessible
global.io = io;

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

/* =================================
   START SERVER
================================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on PORT ${PORT}`);
  startBookingScheduler();
});
