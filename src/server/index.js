const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const history = require('connect-history-api-fallback');
const jwt = require('jsonwebtoken');

const students = require('./routes/students.js');
const admins = require('./routes/admins.js');

const Student = require('./models/Student.js');
const Admin = require('./models/Admin.js');

require('dotenv').config();

if (process.env.NODE_ENV === "production") {
  app.use(cors({
    origin: '#',
    optionsSuccessStatus: 200
  }));
  app.use(history({
    verbose: true
  }));
}
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('dist'));


const validateStudentAccessToken = (req, res, next) => {
  if (req.cookies.studentAccessJwt) {
    jwt.verify(req.cookies.studentAccessJwt, process.env.SECRET, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(403).json({
            error: "Your student session has expired. Please sign in again to restore it",
            status: "tokenExpired"
          });
        }
      }
      Student.findById(decoded.id, (err, student) => {
        if (err) throw err;
        if (!student) {
          res.clearCookie('studentAccessJwt', { httpOnly: true });
          return res.status(400).json({ error: "Your account is no longer found. It may have been deleted" });
        }
        req.student = student;
        return next();
      });
    });
  } else {
    return next();
  }
}

const validateAdminAccessToken = (req, res, next) => {
  if (req.cookies.adminAccessJwt) {
    jwt.verify(req.cookies.adminAccessJwt, process.env.SECRET, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(403).json({
            error: "Your admin session has expired. Please sign in again to restore it",
            status: "tokenExpired"
          });
        }
      }
      Admin.findById(decoded.id, (err, admin) => {
        if (err) throw err;
        if (!admin) {
          res.clearCookie('adminAccessJwt', { httpOnly: true });
          return res.status(403).json({
            error: "Admin account no longer found. It may have been deleted"
          });
        }
        req.admin = admin;
        return next();
      });
    });
  } else {
    return next();
  }
}

app.use(validateStudentAccessToken);
app.use(validateAdminAccessToken);
app.use('/api/students', students);
app.use('/api/admins', admins);

const uri = process.env.MONGO_URI;
mongoose.connect(uri, { useNewUrlParser: true });
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log("Successfully connected to MongoDB database");
});

app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
