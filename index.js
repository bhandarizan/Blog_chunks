const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const Blog = require('./models/blog');

const UserRoute = require('./routes/user');
const blogRoute = require('./routes/blog');
const { checkForAuthenticationCookie } = require('./middlewares/authentication');
const app = express();
const PORT = 8000;


mongoose.connect('mongodb://localhost:27017/blog_chunks')
.then((e) => console.log('Connected to MongoDB')).catch(err => console.log(err));

app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(checkForAuthenticationCookie('token'));
app.use(express.static(path.resolve('./public')))

app.get('/', async(req, res) => { 
  const allBlogs = await Blog.find({});
  res.render('home',{
    user: req.user,
    blogs: allBlogs,
  });
});

app.use('/user', UserRoute);
app.use('/blog', blogRoute);

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});