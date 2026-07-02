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
        blogs: await Blog.find({ status: 'published' }).sort({ createdAt: -1 }),
        error: "Blog not found.",
      });
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
    return res.render('home', {
      user: req.user,
      blogs: await Blog.find({ status: 'published' }).sort({ createdAt: -1 }),
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
      body,
      title,
      status: status || 'published',
      category: category || '',
      tags: tagsArray,
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

async function renderEditBlogPage(req, res) {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog || blog.createdBy.toString() !== req.user._id.toString()) {
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
    if (!blog || blog.createdBy.toString() !== req.user._id.toString()) {
      return res.redirect('/');
    }

    blog.title = title;
    blog.body = body;
    blog.status = status || 'published';
    blog.category = category || '';
    
    if (tags) {
      blog.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
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
    if (!blog || blog.createdBy.toString() !== req.user._id.toString()) {
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
    const blogs = await Blog.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    return res.render('myBlogs', {
      user: req.user,
      blogs,
    });
  } catch (err) {
    console.error(err);
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
};
