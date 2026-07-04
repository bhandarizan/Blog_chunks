const Blog = require('../models/blog');
const Comment = require('../models/comment');
const xss = require('xss');

const BLOGS_PER_PAGE = 6;

function renderAddBlogPage(req, res) {
  return res.render('addBlog', {
    user: req.user,
  });
}

async function handleGetBlogById(req, res) {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy");
    if (!blog) {
      return res.redirect('/?error=Blog+not+found');
    }
    
    // Increment views
    blog.views += 1;
    await blog.save();

    const comments = await Comment.find({ blogId: req.params.id }).populate("createdBy");
    return res.render('blog', {
      user: req.user,
      blog,
      comments,
    });
  } catch (err) {
    console.error("Error fetching blog:", err);
    return res.redirect('/?error=Invalid+Blog+URL');
  }
}

async function handleCreateComment(req, res) {
  const content = req.body.content ? req.body.content.trim() : "";
  if (!content) {
    return res.redirect(`/blog/${req.params.blogId}`);
  }

  try {
    await Comment.create({
      content: xss(content),
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
  const { title, body, status, category, tags } = req.body;
  
  if (!title || !body) {
    return res.render('addBlog', {
      user: req.user,
      error: "Title and body are required.",
    });
  }

  if (!req.file) {
    return res.render('addBlog', {
      user: req.user,
      error: "Please upload a cover image.",
    });
  }

  const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

  try {
    const blog = await Blog.create({
      body: xss(body),
      title: xss(title),
      status: status || 'published',
      category: category ? xss(category) : '',
      tags: tagsArray.map(tag => xss(tag)),
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

function isOwnerOrAdmin(blog, user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return blog.createdBy.toString() === user._id.toString();
}

async function renderEditBlogPage(req, res) {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog || !isOwnerOrAdmin(blog, req.user)) {
      return res.redirect('/');
    }
    return res.render('editBlog', {
      user: req.user,
      blog,
    });
  } catch (err) {
    console.error(err);
    return res.redirect('/');
  }
}

async function handleUpdateBlog(req, res) {
  const { title, body, status, category, tags } = req.body;
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog || !isOwnerOrAdmin(blog, req.user)) {
      return res.redirect('/');
    }

    blog.title = xss(title);
    blog.body = xss(body);
    blog.status = status || 'published';
    blog.category = category ? xss(category) : '';
    
    if (tags) {
      blog.tags = tags.split(',').map(tag => xss(tag.trim())).filter(tag => tag);
    } else {
      blog.tags = [];
    }

    if (req.file) {
      blog.coverImageURL = `/uploads/${req.file.filename}`;
    }

    await blog.save();
    return res.redirect(`/blog/${blog._id}`);
  } catch (err) {
    console.error(err);
    return res.redirect(`/blog/${req.params.id}`);
  }
}

async function handleDeleteBlog(req, res) {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog || !isOwnerOrAdmin(blog, req.user)) {
      return res.redirect('/');
    }
    
    await Blog.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ blogId: req.params.id });
    
    return res.redirect('/blog/my-blogs');
  } catch (err) {
    console.error(err);
    return res.redirect('/');
  }
}

async function handleMyBlogs(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const totalBlogs = await Blog.countDocuments({ createdBy: req.user._id });
    const totalPages = Math.max(1, Math.ceil(totalBlogs / BLOGS_PER_PAGE));

    const blogs = await Blog.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * BLOGS_PER_PAGE)
      .limit(BLOGS_PER_PAGE);

    return res.render('myBlogs', {
      user: req.user,
      blogs,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    console.error(err);
    return res.redirect('/');
  }
}

async function handleToggleLike(req, res) {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.redirect('/');

    const userId = req.user._id.toString();
    const likeIndex = blog.likes.findIndex(id => id.toString() === userId);

    if (likeIndex === -1) {
      blog.likes.push(req.user._id);
    } else {
      blog.likes.splice(likeIndex, 1);
    }

    await blog.save();
    return res.redirect(`/blog/${blog._id}`);
  } catch (err) {
    console.error("Error toggling like:", err);
    return res.redirect('/');
  }
}

module.exports = {
  renderAddBlogPage,
  handleGetBlogById,
  handleCreateComment,
  handleCreateBlog,
  renderEditBlogPage,
  handleUpdateBlog,
  handleDeleteBlog,
  handleMyBlogs,
  handleToggleLike,
  BLOGS_PER_PAGE,
};
