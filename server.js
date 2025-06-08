const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 9070;

// MongoDB connection
mongoose.connect('mongodb+srv://fritz:fritzDb@cluster0.j4jeb.mongodb.net/campus_blogs?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const blogSchema = new mongoose.Schema({
  title: String,
  category: String,
  summary: String,
  content: String,
  imageUrl: String,
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Blog = mongoose.model('Blog', blogSchema);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/uploads';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Route to show home page with blogs
app.get('/', async (req, res) => {
  try {
    const fetch = require('node-fetch'); // place at the top if not already there

let imagePosts = [];
try {
  const response = await fetch('https://www.reddit.com/r/campuslife/top.json?limit=4');
  const redditData = await response.json();
  imagePosts = redditData.data.children.map(post => ({
    title: post.data.title,
    thumbnail: post.data.thumbnail && post.data.thumbnail.startsWith('http') ? post.data.thumbnail : '/default.jpg',
    url: 'https://www.reddit.com' + post.data.permalink,
  }));
} catch (redditErr) {
  console.error('Error fetching Reddit posts:', redditErr);
  imagePosts = [];
}

    const featuredBlogs = await Blog.find({ isFeatured: true }).limit(3);
    const userBlogs = await Blog.find({ isFeatured: false }).limit(5);

    res.render('index', { imagePosts, featuredBlogs, userBlogs });
  } catch (error) {
    console.error('Error loading homepage:', error);
    res.render('index', {
      imagePosts: [],
      featuredBlogs: [],
      userBlogs: []
    });
  }
});

// Route to show full blog post
app.get('/blog/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send('Blog not found');
    res.render('blog', { blog });
  } catch (err) {
    console.error('Error loading blog:', err);
    res.status(500).send('Could not load blog.');
  }
});

// Handle blog form submission
app.post('/blog', upload.single('image'), async (req, res) => {
  try {
    const { title, category, content } = req.body;
    const imageUrl = req.file ? '/uploads/' + req.file.filename : '';

    const summary = content.length > 200 ? content.substring(0, 197) + '...' : content;

    const newBlog = new Blog({
      title,
      category,
      content,
      summary,
      imageUrl,
    });

    await newBlog.save();
    res.redirect('/');
  } catch (err) {
    console.error('Error saving blog:', err);
    res.status(500).send('Could not save blog.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});