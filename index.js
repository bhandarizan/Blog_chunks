require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const Blog = require('./models/blog');

const UserRoute = require('./routes/user');
const blogRoute = require('./routes/blog');
const { checkForAuthenticationCookie } = require('./middlewares/authentication');
const app = express();
const PORT = process.env.PORT || 8000;


const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/blog_chunks';
mongoose.connect(MONGO_URL)
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(checkForAuthenticationCookie('token'));
app.use(express.static(path.resolve('./public')))
const { BLOGS_PER_PAGE } = require('./controllers/blog');

app.get('/', async(req, res) => { 
  const page = parseInt(req.query.page) || 1;
  const totalBlogs = await Blog.countDocuments({ status: 'published' });
  const totalPages = Math.max(1, Math.ceil(totalBlogs / BLOGS_PER_PAGE));

  const allBlogs = await Blog.find({ status: 'published' })
    .sort({ createdAt: -1 })
    .skip((page - 1) * BLOGS_PER_PAGE)
    .limit(BLOGS_PER_PAGE)
    .populate('createdBy', 'fullName profileImageURL');

  res.render('home',{
    user: req.user,
    blogs: allBlogs,
    currentPage: page,
    totalPages,
    totalBlogs,
    error: req.query.error || null,
  });
});

app.use('/user', UserRoute);
app.use('/blog', blogRoute);

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});