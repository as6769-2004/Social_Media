const express = require("express");
const cors = require("cors");
const postsRoutes = require("./routes/posts"); // make sure this exists
const commentsRoutes = require("./routes/comments");
const likesRoutes = require("./routes/postLikes");
const pollRoutes = require("./routes/poll");

const app = express();
app.use(cors());
app.use(express.json());

// ⚠ Make sure these are routers, not controllers
app.use("/posts", postsRoutes);
app.use("/comments", commentsRoutes);
app.use("/postlikes", likesRoutes);
app.use("/poll", pollRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
 