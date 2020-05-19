const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const sslRedirect = require('heroku-ssl-redirect');


const students = require('./routes/students.js');
const admins = require('./routes/admins.js');
const meetings = require('./routes/meetings.js');

const Student = require('./models/Student.js');
const Admin = require('./models/Admin.js');
const Meeting = require('./models/Meeting.js');

require('dotenv').config();


app.use(sslRedirect());
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
app.use('/api/meetings', meetings);

if (process.env.NODE_ENV === "production") {
  app.use(cors({
    origin: '#',
    optionsSuccessStatus: 200
  }));
  app.get('/*', (req, res) => {
    res.sendFile('dist/index.html', (err) => {
      if (err) {
        res.status(500).send(err);
      }
    })
  });
}

const uri = process.env.MONGO_URI;
mongoose.connect(uri, { useNewUrlParser: true });
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log("Successfully connected to MongoDB database");
});

const server = app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
const io = require("socket.io")(server);
io.use((socket, next) => {
  const currTime = new Date();
  const currDate = new Date(currTime);
  currDate.setHours(currDate.getHours() - 4);
  currDate.setUTCHours(4, 0, 0, 0);
  console.log(currTime);
  console.log(currDate);

  Meeting
    .findOne({ date: currDate })
    .populate({
      path: 'attendants',
      model: 'Student'
    })
    .exec((err, meeting) => {
      if (err) throw err;
      if (!meeting) {
        return next(new Error("There is no meeting today!"));
      }
      if (currTime < meeting.startTime) {
        return next(new Error("The meeting has not started yet!"));
      } else if (currTime > meeting.endTime) {
        console.log("here");
        return next(new Error("The meeting has already passed!"));
      }

      socket.meeting = meeting;
      if (!socket.handshake.headers.cookie) {
        socket.handshake.headers.cookie = "";
      }

      const cookies = cookie.parse(socket.handshake.headers.cookie);
      const studentAccessToken = cookies['studentAccessJwt'];
      const adminAccessToken = cookies['adminAccessJwt'];

      if (adminAccessToken) {
        jwt.verify(adminAccessToken, process.env.SECRET, (err, decoded) => {
          if (err) {
            if (err.name === "TokenExpiredError") {
              return next(new Error("Your token is expired. Please sign-in again"));
            }
          }
          Admin.findById(decoded.id, (err, admin) => {
            if (err) throw err;
            if (!admin) {
              return next(new Error("Your account no longer exists. It may have been deleted"));
            }
            socket.admin = admin;
            next();
          });
        });
      } else if (studentAccessToken) {
        jwt.verify(studentAccessToken, process.env.SECRET, (err, decoded) => {
          if (err) {
            if (err.name === "TokenExpiredError") {
              return next(new Error("Your token is expired. Please sign-in again"));
            }
          }
          Student.findById(decoded.id, (err, student) => {
            if (err) throw err;
            if (!student) {
              return next(new Error("Your account no longer exists. It may have been deleted"));
            }
            socket.student = student;
            next();
          });
        });
      } else {
        return next(new Error("You are not signed in!"));
      }
    });
});

io.on('connection', (socket) => {
  if (socket.admin) {
    console.log(socket.meeting);
    socket.emit('meetingData', socket.meeting);
    socket.meeting.attendants.forEach((attendant) => {
      const attendantObject = attendant.toObject();
      delete attendantObject.password;
      socket.emit('studentSignedIn', attendantObject);
    });
  } else if (socket.student) {
    const meetingData = socket.meeting.toObject();
    delete meetingData.joinCode;
    socket.emit('meetingData', meetingData);

    socket.on('joinCodeSubmit', (data) => {
      console.log("here");
      if (data.joinCode.toLowerCase() === socket.meeting.joinCode.toLowerCase()) {
        const student = socket.student.toObject();
        const attendants = socket.meeting.toObject().attendants;
        let isAlreadyInDb = false;
        for (let i = 0; i < attendants.length; i++) {
          if (attendants[i]._id+"" === student._id+"") {
            isAlreadyInDb = true;
          }
        }
        if (!isAlreadyInDb) {
          socket.meeting.attendants.push(student);
          socket.meeting.save((err) => {
            if (err) throw err;
          });
        }
        delete student.password;
        socket.emit('studentDetected');
        io.sockets.emit('studentSignedIn', student);
      } else {
        console.log("here");
        socket.emit('incorrectCode');
      }
    });
  }
});
