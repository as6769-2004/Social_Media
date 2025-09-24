const express = require("express");
const router = express.Router();
// Change this line:
const postsController = require("../controllers/postsController");

// Make sure ../controllers/postsController.js exists

// Posts
router.get("/", postsController.getPosts);
router.post("/", postsController.createPost);
router.delete("/:id", postsController.deletePost);

module.exports = router;
// 