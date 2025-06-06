const express = require('express');
const morgan = require('morgan');
const cors  = require('cors');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

const PORT = process.env.PORT || 9070;

app.get('/', (req, res) => {
    res.render('index');
})

app.listen(PORT, () => {
    console.log(`Server is listening at ${PORT}`);
});