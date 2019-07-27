const express = require('express');
const app = express();
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const history = require('connect-history-api-fallback');

const clubowners = require('./routes/clubowners');
const clubs = require('./routes/clubs');
const students = require('./routes/students');

require('dotenv').config();

if (process.env.NODE_ENV === "production") {
  app.use(cors({
    origin: 'https://mern-club-fair-signup.herokuapp.com/',
    optionsSuccessStatus: 200
  }));
  app.use(history({
    verbose: true
  }));
}
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(express.static('dist'));
app.use(cookieParser());

app.use("/clubs", clubs);
app.use("/clubowners", clubowners);
app.use("/students", students);

const uri = process.env.MONGO_URI;
mongoose.connect(uri, { useNewUrlParser: true });
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log("Successfully connected to MongoDB database");
});

app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
