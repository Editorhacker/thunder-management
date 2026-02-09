const http = require("http");
const app = require("./src/index");
const { startBookingScheduler } = require("./src/services/bookingScheduler");

const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "*"
    }
});

// expose io globally
global.io = io;

io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("🔴 Client disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
    startBookingScheduler();
});
