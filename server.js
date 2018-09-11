const express = require("express");
const http = require("http");
const app = express();
const socketIO = require("socket.io");
const port = process.env.PORT || 4869;

const server = http.createServer(app);
const io = socketIO(server);

const originalData = require("./helpers/originalData");
const {
  modifyPriceAndVolume,
  modifyChange,
  modifyChangePercent,
  modifyStatus
} = require("./helpers/functions");

var previousData = [];
app.use(express.static("build"));

io.on("connection", socket => {
  console.log("User connected");
  // The first time server is on
  if (!previousData.length) {
    const newData = originalData.map(row => {
      return {
        ...row,
        lastestPrice: row.originalPrice,
        lastestVolume: row.originalVolume
      };
    });
    previousData = [...newData];
    io.sockets.emit("change data", previousData);
  } else {
    io.sockets.emit("change data", previousData);
  }

  // Server emits data every 5 seconds
  const refreshIntervalId = setInterval(() => {
    const newData = previousData.map(row => {
      const modifiedPriceAndVolume = modifyPriceAndVolume(row);
      const modifiedChange = modifyChange(modifiedPriceAndVolume);
      const modifiedChangePercent = modifyChangePercent(modifiedChange);
      const modifiedStatus = modifyStatus(modifiedChangePercent);
      return modifiedStatus;
    });
    previousData = [...newData];
    io.sockets.emit("change data", previousData);
  }, 5000);

  socket.on("disconnect", () => {
    clearInterval(refreshIntervalId);
    socket.disconnect();
    console.log("User disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
