const pool = require("../config/db");

// GET /posts?page=&limit=
exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const [totalRows] = await pool.query("SELECT COUNT(*) as count FROM posts");
    const totalPosts = totalRows[0].count;
// 
    const [posts] = await pool.query(
      `SELECT 
         p.id, 
         p.user_id, 
         u.username AS username, 
         p.text, 
         p.media, 
         p.created_at, 
         p.updated_at,
         (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likesCount,
         (SELECT COUNT(*) FROM post_views pv WHERE pv.post_id = p.id) AS viewsCount,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS commentsCount
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Parse media JSON
    posts.forEach((post) => {
      try {
        post.media = JSON.parse(post.media || "[]");
      } catch {
        post.media = [];
      }
    });

    res.json({
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
      posts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot fetch posts" });
  }
};

// CREATE POST
exports.createPost = async (req, res) => {
  const { userId, text, media } = req.body;

  if (!userId || !text || text.trim() === "") {
    return res.status(400).json({ error: "Invalid userId or text" });
  }

  try {
    const mediaValue = Array.isArray(media) ? JSON.stringify(media) : JSON.stringify([]);

    const [result] = await pool.query(
      "INSERT INTO posts (user_id, text, media) VALUES (?, ?, ?)",
      [userId, text, mediaValue]
    );

    const postId = result.insertId;

    // Fetch newly created post with counts
    const [rows] = await pool.query(
      `SELECT 
         p.id, 
         p.user_id, 
         u.username AS username, 
         p.text, 
         p.media, 
         p.created_at, 
         p.updated_at,
         (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likesCount,
         (SELECT COUNT(*) FROM post_views pv WHERE pv.post_id = p.id) AS viewsCount,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS commentsCount
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`,
      [postId]
    );

    try {
      rows[0].media = rows[0].media ? JSON.parse(rows[0].media) : [];
    } catch (e) {
      rows[0].media = [];
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot create post" });
  }
};

// DELETE POST
exports.deletePost = async (req, res) => {
  const postId = req.params.id;
  try {
    const [result] = await pool.query("DELETE FROM posts WHERE id = ?", [postId]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Post not found" });
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cannot delete post" });
  }
};
