const Blog = require('../models/blog');
const Comment = require('../models/comment');

function renderAddBlogPage(req, res) {
  return res.render('addBlog', {
    user: req.user,
  });
}

async function handleGetBlogById(req, res) {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy");
    if (!blog) {
      return res.render('home', {
        user: req.user,
        blogs: await Blog.find({}),
        error: "Blog not found.",
      });
    }
    const comments = await Comment.find({ blogId: req.params.id }).populate("createdBy");
    return res.render('blog', {
      user: req.user,
      blog,
      comments,
    });
  } catch (err) {
    console.error("Error fetching blog:", err);
    // Render home with error if the id is invalid or DB error occurs
    return res.render('home', {
      user: req.user,
      blogs: await Blog.find({}),
      error: "Invalid Blog URL or Blog not found.",
    });
  }
}

async function handleCreateComment(req, res) {
  const content = req.body.content ? req.body.content.trim() : "";
  if (!content) {
    return res.redirect(`/blog/${req.params.blogId}`);
  }

  try {
    await Comment.create({
      content,
      blogId: req.params.blogId,
      createdBy: req.user._id,
    });
    return res.redirect(`/blog/${req.params.blogId}`);
  } catch (err) {
    console.error("Error creating comment:", err);
    return res.redirect(`/blog/${req.params.blogId}`);
  }
}

async function handleCreateBlog(req, res) {
  const { title, body } = req.body;
  
  if (!title || !body) {
    return res.render('addBlog', {
      user: req.user,
      error: "Title and body are required.",
    });
  }

  // Cover image sanity check: Multer populates req.file if a file was uploaded.
  if (!req.file) {
    return res.render('addBlog', {
      user: req.user,
      error: "Please upload a cover image.",
    });
  }

  try {
    const blog = await Blog.create({
      body,
      title,
      createdBy: req.user._id,
      coverImageURL: `/uploads/${req.file.filename}`,
    });
    return res.redirect(`/blog/${blog._id}`);
  } catch (err) {
    console.error("Error creating blog:", err);
    return res.render('addBlog', {
      user: req.user,
      error: "Failed to create blog. Please try again.",
    });
  }
}

module.exports = {
  renderAddBlogPage,
  handleGetBlogById,
  handleCreateComment,
  handleCreateBlog,
};
