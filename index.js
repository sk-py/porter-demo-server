// const express = require("express");
// const http = require("http");
// const ConnectToMongo = require("./connection");
// require("dotenv").config();

// ConnectToMongo();

// const { Server } = require("socket.io");
// const { handleSignup, handleLogin } = require("./controllers/auth");

// const app = express();

// app.use(express.json());
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*" },
// });

// const deliveryGuys = {};

// // io.on("connection", (socket) => {
// //   console.log("A user connected", socket.id);

// //   socket.on("location", ({ role, username, coords }) => {
// //     console.log(role, username, coords);

// //     io.emit("updateLocation", { id: socket.id, coords });
// //   });

// //   socket.on("disconnect", () => {
// //     console.log("User disconnected:", socket.id);
// //   });
// // });

// io.on("connection", (socket) => {
//   console.log("A user connected", socket.id);

//   // When a delivery guy sends their location
//   socket.on("location", ({ role, username, coords }) => {
//     console.log(role, username, coords);
//     deliveryGuys[username] = { id: socket.id, coords }; // Store or update the delivery guy's coordinates
//     io.emit("updateLocation", { id: socket.id, coords });

//     // Emit active delivery guys when an admin connects
//     if (role == "admin") {
//       socket.emit("activePorters", Object.keys(deliveryGuys)); // Send list of active porters
//     }
//   });

//   socket.on("admin-connect", (role) => {
//     if (role == "admin") {
//       socket.emit("activePorters", Object.keys(deliveryGuys)); // Send list of active porters
//     }
//   });

//   // Handle admin requests for specific porter's coordinates
//   socket.on("requestPorterCoords", (username) => {
//     const porter = deliveryGuys[username];
//     if (porter) {
//       socket.emit("porterCoords", { username, coords: porter.coords });
//     } else {
//       console.log("No active porters");
//     }
//     console.log(porter);
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//     // Remove the delivery guy from the list on disconnect
//     for (const username in deliveryGuys) {
//       if (deliveryGuys[username].id === socket.id) {
//         delete deliveryGuys[username];
//         console.log(`Delivery guy ${username} disconnected`);
//       }
//     }
//   });
// });

// app.post("/api/login", handleLogin);

// app.post("/api/signup", handleSignup);

// const PORT = process.env.PORT || 3000;

// server.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server running on port ${PORT}`);
// });

const express = require("express");
const http = require("http");
const ConnectToMongo = require("./connection");
require("dotenv").config();

ConnectToMongo();

const { Server } = require("socket.io");
const { handleSignup, handleLogin } = require("./controllers/auth");

const app = express();

app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const deliveryGuys = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // When a delivery guy sends their location
  socket.on("location", ({ role, username, coords }) => {
    console.log(role, username, coords);
    deliveryGuys[username] = { id: socket.id, coords }; // Store or update the delivery guy's coordinates
    io.emit("updateLocation", { id: socket.id, coords });
    io.emit("porterCoords", { username, coords });
    // Emit active delivery guys to all admins
    io.emit("activePorters", Object.keys(deliveryGuys)); // Send list of active porters
  });

  // Handle admin connections
  socket.on("admin-connect", () => {
    console.log("Admin connected:", socket.id);
    // Emit active delivery guys when an admin connects
    socket.emit("activePorters", Object.keys(deliveryGuys)); // Send list of active porters
  });

  socket.on("requestPorterCoords", (username) => {
    const porter = deliveryGuys[username];
    if (porter) {
      socket.emit("porterCoords", { username, coords: porter.coords });
    } else {
      console.log("No active porters");
      // Optionally send a message back to indicate no active porters found.
      socket.emit("porterCoords", { username, coords: null });
    }
  });

  socket.on("disconnected-porter", ({ username, id }) => {
    // Check if the delivery guy exists in the deliveryGuys object
    if (deliveryGuys[username] && deliveryGuys[username].id === id) {
      delete deliveryGuys[username]; // Remove the delivery guy by username
      console.log(`Delivery guy ${username} disconnected`);

      // Emit updated list of active porters to all admins
      io.emit("activePorters", Object.keys(deliveryGuys));
    } else {
      console.log(
        `No active porter found with username: ${username} and id: ${id}`
      );
    }
    console.log(deliveryGuys); // Log the updated deliveryGuys object
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Remove the delivery guy from the list on disconnect
    for (const username in deliveryGuys) {
      if (deliveryGuys[username].id === socket.id) {
        delete deliveryGuys[username];
        console.log(`Delivery guy ${username} disconnected`);
        // Emit updated list of active porters to all admins
        io.emit("activePorters", Object.keys(deliveryGuys));
      }
    }
  });
});

app.post("/api/login", handleLogin);
app.post("/api/signup", handleSignup);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({ mssg: "Success" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
