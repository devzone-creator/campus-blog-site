const express = require('express');
const morgan = require('morgan');
const fetch = require('node-fetch');
const cron = require('node-cron');
const cors = require('cors');

const CLIENT_ID = process.env.CLIENT_ID || '0Izfz1ol30M6-Lka5s6uvg';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'bRDpLetPvQLYDFQmm0w7YbsxUwmMSg';

const app = express();
const PORT = process.env.PORT || 9070;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

let cachedPosts = []; // In-memory cache

// Reusable fetch function
async function fetchRedditPosts() {
  try {
    const token = await getRedditAccessToken();
    const response = await fetch('https://oauth.reddit.com/r/college/top?limit=3', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'campus-blog-site/1.0 (by /u/fraizyglime)'
      }
    });

    const data = await response.json();
    cachedPosts = data.data.children.map(child => ({
      title: child.data.title,
      url: 'https://reddit.com' + child.data.permalink,
      thumbnail: child.data.thumbnail && child.data.thumbnail.startsWith('http')
        ? child.data.thumbnail
        : 'https://via.placeholder.com/300x180?text=No+Image'
    }));

    console.log('✅ Reddit posts fetched and cached.');
  } catch (error) {
    console.error('❌ Failed to fetch Reddit posts:', error.message);
  }
}

// Get Reddit API token
async function getRedditAccessToken() {
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token;
}

// Schedule background fetching every 5 mins
cron.schedule('*/5 * * * *', () => {
  console.log('⏰ Running scheduled fetch...');
  fetchRedditPosts();
});

// Initial fetch on server start
fetchRedditPosts();

// Home route serves cached posts
app.get('/', (req, res) => {
  res.render('index', { posts: cachedPosts });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is listening at ${PORT}`);
});