const express = require("express");
const router = express.Router();
const postLikesController = require("../controllers/postLikesController");

// Like a post
router.post("/:postId/like", postLikesController.likePost);

// Unlike a post
router.delete("/:postId/unlike", postLikesController.unlikePost);

module.exports = router;


// http://localhost:5000/postlikes/3/unlike
// http://localhost:5000/postlikes/3/like