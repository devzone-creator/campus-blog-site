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
    cachedPosts = data.data.children.map(child => {
    const thumbnail = 
          child.data.thumbnail && /^https?:\/\//.test(child.data.thumbnail)
            ? child.data.thumbnail
            : child.data.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') || 'https://via.placeholder.com/300x180?text=No+Image';

        return {
          title: child.data.title,
          url: 'https://reddit.com' + child.data.permalink,
          thumbnail
        };
    });


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
app.get('/', async (req, res) => {
  try {
    const token = await getRedditAccessToken();

    // Fetch /r/college (text-based)
    const collegeRes = await fetch('https://oauth.reddit.com/r/college/top?limit=3', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'campus-blog-site/1.0 (by /u/fraizyglime)'
      }
    });
    const collegeData = await collegeRes.json();
    const collegePosts = collegeData.data.children.map(child => ({
      title: child.data.title,
      url: 'https://reddit.com' + child.data.permalink
    }));

    // Fetch /r/pics (image-based)
    const picsRes = await fetch('https://oauth.reddit.com/r/pics/top?limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'campus-blog-site/1.0 (by /u/fraizyglime)'
      }
    });
    const picsData = await picsRes.json();
    const imagePosts = picsData.data.children
      .map(child => {
        const previewUrl = child.data.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&');
        if (!previewUrl) return null;
        return {
          title: child.data.title,
          url: 'https://reddit.com' + child.data.permalink,
          thumbnail: previewUrl
        };
      })
      .filter(Boolean)
      .slice(0, 3); // Limit to 4 images max

    res.render('index', {
      collegePosts,
      imagePosts
    });

  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    res.status(500).send('Internal server error.');
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is listening at ${PORT}`);
});