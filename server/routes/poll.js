const express = require("express");
const router = express.Router();
const pollController = require("../controllers/pollController");

// GET /polls?page=&limit=
router.get("/", pollController.getPolls);
// http://localhost:5000/poll?page=1&limit=5

// Create poll with options
router.post("/", pollController.createPollWithOptions);

// Vote for a poll option
router.post("/vote/:pollOptionId", pollController.votePollOption);

// Get poll results
router.get("/:pollId/results", pollController.getPollResults);

// Update poll
router.put("/:pollId", pollController.updatePoll);

// delete
router.delete("/:pollId", pollController.deletePoll);

module.exports = router;
