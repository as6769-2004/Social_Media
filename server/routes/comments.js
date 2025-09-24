const express = require("express");
const router = express.Router();
const commentsController = require("../controllers/commentsController");

router.post("/:postId/comments", commentsController.addComment);
router.delete("/:postId/comments", commentsController.deleteComment);

module.exports = router;

//