const pool = require("../config/db");

// Get polls with pagination
exports.getPolls = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    // Total polls count
    const [totalRows] = await pool.query("SELECT COUNT(*) AS count FROM polls");
    const totalPolls = totalRows[0].count;
// 
    // Fetch polls with options
    const [polls] = await pool.query(
      `SELECT id AS pollId, user_id AS userId, question, multiple_choice, created_at
       FROM polls
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Fetch options for each poll
    for (let poll of polls) {
      const [options] = await pool.query(
        "SELECT id AS optionId, text FROM poll_options WHERE poll_id = ? ORDER BY id ASC",
        [poll.pollId]
      );
      poll.options = options;
    }

    res.json({
      currentPage: page,
      totalPages: Math.ceil(totalPolls / limit),
      totalPolls,
      polls,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot fetch polls" });
  }
};

// Create poll with options
exports.createPollWithOptions = async (req, res) => {
  const { userId, question, multiple_choice, options } = req.body;

  if (!userId || !question || question.trim() === "") {
    return res.status(400).json({ error: "userId and question are required" });
  }

  if (!Array.isArray(options) || options.length === 0) {
    return res.status(400).json({ error: "Options array is required" });
  }

  try {
    await pool.query("START TRANSACTION");

    // Insert poll
    const [pollResult] = await pool.query(
      "INSERT INTO polls (user_id, question, multiple_choice) VALUES (?, ?, ?)",
      [userId, question, multiple_choice || false]
    );
    const pollId = pollResult.insertId;

    // Insert poll options (skip duplicates)
    for (let text of options) {
      if (!text || text.trim() === "") continue;
      await pool.query(
        "INSERT IGNORE INTO poll_options (poll_id, text) VALUES (?, ?)",
        [pollId, text]
      );
    }

    // Fetch poll and options
    const [pollRows] = await pool.query(
      "SELECT id AS pollId, question, multiple_choice FROM polls WHERE id = ?",
      [pollId]
    );
    const poll = pollRows[0];

    const [optionRows] = await pool.query(
      "SELECT id AS optionId, text FROM poll_options WHERE poll_id = ? ORDER BY id ASC",
      [pollId]
    );
    poll.options = optionRows;

    await pool.query("COMMIT");

    res.status(201).json({ poll });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Cannot create poll with options" });
  }
};

// Update poll (fixed 4 options)
exports.updatePoll = async (req, res) => {
  const { pollId } = req.params;
  const { question, multiple_choice, options } = req.body;

  if (!question || question.trim() === "") {
    return res.status(400).json({ error: "Poll question is required" });
  }

  if (!Array.isArray(options) || options.length !== 4) {
    return res.status(400).json({ error: "Exactly 4 options are required" });
  }

  try {
    await pool.query("START TRANSACTION");

    // Update poll
    await pool.query(
      "UPDATE polls SET question = ?, multiple_choice = ? WHERE id = ?",
      [question, multiple_choice || false, pollId]
    );

    // Update each option
    for (let opt of options) {
      if (!opt.id || !opt.text || opt.text.trim() === "") {
        await pool.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Each option must have id and text" });
      }

      await pool.query(
        "UPDATE poll_options SET text = ? WHERE id = ? AND poll_id = ?",
        [opt.text, opt.id, pollId]
      );
    }

    // Fetch updated poll and options
    const [pollRows] = await pool.query(
      "SELECT id AS pollId, question, multiple_choice FROM polls WHERE id = ?",
      [pollId]
    );
    const poll = pollRows[0];

    const [optionRows] = await pool.query(
      "SELECT id AS optionId, text FROM poll_options WHERE poll_id = ? ORDER BY id ASC",
      [pollId]
    );
    poll.options = optionRows;

    await pool.query("COMMIT");

    res.json({ poll });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Cannot update poll" });
  }
};

// Vote for a poll option
exports.votePollOption = async (req, res) => {
  const { pollOptionId } = req.params;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "Invalid userId" });

  try {
    await pool.query(
      "INSERT IGNORE INTO poll_votes (poll_option_id, user_id) VALUES (?, ?)",
      [pollOptionId, userId]
    );

    const [votes] = await pool.query(
      "SELECT COUNT(*) AS voteCount FROM poll_votes WHERE poll_option_id = ?",
      [pollOptionId]
    );

    res.json({ pollOptionId, voteCount: votes[0].voteCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot vote" });
  }
};

// Get poll results
exports.getPollResults = async (req, res) => {
  const { pollId } = req.params;

  try {
    const [options] = await pool.query(
      `SELECT 
         po.id AS optionId,
         po.text,
         (SELECT COUNT(*) FROM poll_votes pv WHERE pv.poll_option_id = po.id) AS voteCount
       FROM poll_options po
       WHERE po.poll_id = ? ORDER BY po.id ASC`,
      [pollId]
    );

    res.json({ pollId, options });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot fetch poll results" });
  }
};

// Delete poll
exports.deletePoll = async (req, res) => {
  const { pollId } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM polls WHERE id = ?", [
      pollId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Poll not found" });
    }

    res.json({ message: "Poll deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot delete poll" });
  }
};
