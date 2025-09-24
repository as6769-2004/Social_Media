const pool = require("../config/db");

// Like a post
exports.likePost = async (req, res) => {
  const postId = req.params.postId;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "Invalid userId" });

  try {
    // Insert into post_likes if not already liked
    await pool.query(
      "INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)",
      [postId, userId]
    );
// 
    // Get updated likes count
    const [likes] = await pool.query(
      "SELECT COUNT(*) AS likesCount FROM post_likes WHERE post_id = ?",
      [postId]
    );

    res.json({ likesCount: likes[0].likesCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot like post" });
  }
};

// Unlike a post
exports.unlikePost = async (req, res) => {
  const postId = req.params.postId;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "Invalid userId" });

  try {
    const [result] = await pool.query(
      "DELETE FROM post_likes WHERE post_id = ? AND user_id = ?",
      [postId, userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Like not found" });

    // Get updated likes count
    const [likes] = await pool.query(
      "SELECT COUNT(*) AS likesCount FROM post_likes WHERE post_id = ?",
      [postId]
    );

    res.json({ likesCount: likes[0].likesCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot remove like" });
  }
};
