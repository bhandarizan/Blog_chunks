const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const UserRoute = require('./routes/user');

const app = express();
const PORT = 8000;

mongoose.connect('mongodb://localhost:27017/blog_chunks')
.then((e) => console.log('Connected to MongoDB')).catch(err => console.log(err));

app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => { 
  res.render('home');
});

app.use('/user', UserRoute);

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});