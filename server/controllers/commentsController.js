const pool = require("../config/db");

// Add a comment to a post
exports.addComment = async (req, res) => {
  const postId = req.params.postId;
  const { userId, text } = req.body;

  if (!userId || !text || text.trim() === "")
    return res.status(400).json({ error: "Invalid input" });

  try {
    // Optional: limit one comment per user per post (can remove if multiple allowed)
    const [existing] = await pool.query(
      "SELECT * FROM comments WHERE post_id = ? AND user_id = ?",
      [postId, userId]
    );
    if (existing.length > 0)
      return res.status(400).json({ error: "Already commented" });

    // Optional: max 10 comments per post
    const [count] = await pool.query(
      "SELECT COUNT(*) as c FROM comments WHERE post_id = ?",
      [postId]
    );
    if (count[0].c >= 10)
      return res.status(400).json({ error: "Max 10 comments per post" });

    // Insert comment
    const [result] = await pool.query(
      "INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)",
      [postId, userId, text]
    );
    const commentId = result.insertId;

    // Fetch all comments with likes count
    const [comments] = await pool.query(
      `SELECT 
         c.id, 
         c.user_id, 
         u.username AS username, 
         c.text, 
         c.created_at,
         (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) AS likesCount
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId]
    );

    res.status(201).json({ postId, comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot add comment" });
  }
};

// Delete a comment from a post
exports.deleteComment = async (req, res) => {
  const postId = req.params.postId;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "Invalid userId" });

  try {
    // Delete the comment
    const [result] = await pool.query(
      "DELETE FROM comments WHERE post_id = ? AND user_id = ?",
      [postId, userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Comment not found" });

    // Fetch remaining comments with likes count
    const [comments] = await pool.query(
      `SELECT 
         c.id, 
         c.user_id, 
         u.username AS username, 
         c.text, 
         c.created_at,
         (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) AS likesCount
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId]
    );

    res.json({ postId, comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot delete comment" });
  }
};
