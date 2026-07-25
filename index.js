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
  try {
    const page = parseInt(req.query.page) || 1;
    const category = req.query.category ? req.query.category.trim() : '';
    const sort = req.query.sort || 'latest';
    const searchQuery = req.query.q ? req.query.q.trim() : '';

    const filter = { status: 'published' };
    
    if (category) {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i');
      filter.$or = [
        { title: searchRegex },
        { body: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'popular') {
      sortOptions = { views: -1, createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    }

    const categories = await Blog.distinct('category', { status: 'published', category: { $ne: null } });
    const filteredCategories = categories.filter(c => c && c.trim().length > 0);

    let blogs;
    let totalBlogs = await Blog.countDocuments(filter);

    if (sort === 'liked') {
      const pipeline = [
        { $match: filter },
        { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
        { $sort: { likesCount: -1, createdAt: -1 } },
        { $skip: (page - 1) * BLOGS_PER_PAGE },
        { $limit: BLOGS_PER_PAGE }
      ];

      blogs = await Blog.aggregate(pipeline);
      await Blog.populate(blogs, { path: 'createdBy', select: 'fullName profileImageURL' });
    } else {
      blogs = await Blog.find(filter)
        .sort(sortOptions)
        .skip((page - 1) * BLOGS_PER_PAGE)
        .limit(BLOGS_PER_PAGE)
        .populate('createdBy', 'fullName profileImageURL');
    }

    const totalPages = Math.max(1, Math.ceil(totalBlogs / BLOGS_PER_PAGE));

    res.render('home', {
      user: req.user,
      blogs: blogs,
      currentPage: page,
      totalPages,
      totalBlogs,
      selectedCategory: category,
      selectedSort: sort,
      searchQuery,
      categories: filteredCategories,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error("Error loading homepage:", err);
    res.render('home', {
      user: req.user,
      blogs: [],
      currentPage: 1,
      totalPages: 1,
      totalBlogs: 0,
      selectedCategory: '',
      selectedSort: 'latest',
      searchQuery: '',
      categories: [],
      error: "Error loading articles.",
    });
  }
});

app.use('/user', UserRoute);
app.use('/blog', blogRoute);

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});