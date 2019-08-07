const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const mailer = require('../mailer.js');
const CronJob = require('cron').CronJob;
const fs = require('fs');

const Meeting = require('../models/Meeting');
const Student = require('../models/Student.js');
const Admin = require('../models/Admin.js');

const job = new CronJob('4 23 * * *', () => {
  const tomorrowsDate = new Date();
  tomorrowsDate.setHours(tomorrowsDate.getHours() - 4);
  tomorrowsDate.setDate(tomorrowsDate.getDate() + 1)
  tomorrowsDate.setUTCHours(4, 0, 0, 0);
  console.log(tomorrowsDate);
  Meeting.findOne({ date: tomorrowsDate.toISOString() }, (err, meeting) => {
    if (err) console.log(err);
    console.log(meeting);
    if (meeting) {
      Student.find({}, (err, students) => {
        if (err) console.log(err);
        students.forEach((student) => {
          console.log(student);
          mailer.sendRemindMail(student.email, {
            date: meeting.date,
            startTime: meeting.startTime,
            endTime: meeting.endTime
          });
        });
      })
    }
  })
}, null, true, 'America/New_York');

router.get('/', (req, res) => {
  if (!req.student && !req.admin) {
    return res.status(403).json({ error: "You are not signed in!", status: "notAuthorized" });
  }

  Meeting
    .find({})
    .populate({
      path: 'attendants',
      model: 'Student'
    }).exec((err, meetings) => {
      if (err) throw err;
      return res.json({
        meetings: meetings
      });
    });
});

router.get('/:id', (req, res) => {
  if (!req.student && !req.admin) {
    return res.status(403).json({ error: "You are not authorized!" });
  }

  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  Meeting.findOne({ _id: id }, (err, meeting) => {
    if (err) throw err;
    if (!meeting) {
      return res.status(400).json({
        error: "Meeting with that ID not found"
      });
    }
    return res.json({
      meeting: meeting
    });
  });
});

router.post('/', (req, res) => {
  if (!req.admin) {
    return res.status(403).json({ error: "You are not authorized!" });
  }

  const dateRegex = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;

  if (!req.body.date || !(dateRegex.test(req.body.date))) {
    return res.status(400).json({ error: "Invalid date" });
  }
  if (!req.body.startTime || !(dateRegex.test(req.body.startTime))) {
    return res.status(400).json({ error: "Invalid start time" });
  }
  if (!req.body.endTime || !(dateRegex.test(req.body.endTime))) {
    return res.status(400).json({ error: "Invalid end date" });
  }
  if (req.body.startTime >= req.body.endTime) {
    return res.status(400).json({ error: "Start time cannot be later than end time" });
  }

  const newMeeting = new Meeting({
    _id: new mongoose.Types.ObjectId(),
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    lastEditedBy: req.admin._id
  });

  newMeeting.save((err) => {
    if (err) {
      let { message } = err;
      if (err.code === 11000) {
        message = "There is already a meeting on this date.";
      }
      return res.status(400).json({ error: message });
    }
    return res.json({
      success: "Meeting successfully created",
      newMeeting: newMeeting
    });
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  if (!req.admin) {
    return res.status(403).json({ error: "You are not authorized!" });
  }

  const dateRegex = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;

  if (req.body.date && !(dateRegex.test(req.body.date))) {
    return res.status(400).json({ error: "Invalid date" });
  }
  if (req.body.startTime && !(dateRegex.test(req.body.startTime))) {
    return res.status(400).json({ error: "Invalid start time" });
  }
  if (req.body.endTime && !(dateRegex.test(req.body.endTime))) {
    return res.status(400).json({ error: "Invalid end date" });
  }
  if ((req.body.startTime && req.body.endTime) && (req.body.startTime >= req.body.endTime)) {
    return res.status(400).json({ error: "Start time cannot be later than end time" });
  }
  if (req.body.attendants) {
    if (!Array.isArray(req.body.attendants)) {
      return res.status(400).json({ error: "New attendants must be provided in an array" });
    }
    req.body.attendants.forEach((attendant) => {
      if (!mongoose.Types.ObjectId.isValid(attendant)) {
        return res.status(400).json({ error: "Invalid ID for attendant" });
      }
    });
  }

  Meeting.findOne({ _id: id }, (err, meeting) => {
    if (err) throw err;
    if (!meeting) return res.status(400).json({ error: "Meeting by that ID not found" });

    meeting.lastEditedBy = req.admin._id;
    for (let field in req.body) {
      if (meeting[field]) {
        if (field == "attendants") {
          for (let i = 0; i < req.body[field].length; i++) {
            meeting[field].push(req.body[field][i]);
          }
        } else {
          meeting[field] = req.body[field];
        }
      }
    }
    meeting.save((err) => {
      if (err) {
        let { message } = err;
        if (err.code === 11000) {
          message = "There is already a meeting on this date.";
        }
        return res.status(400).json({ error: message });
      }
      return res.json({ success: "Succesfully updated meeting" });
    });
  });
});

router.delete('/:id', (req, res) => {
  if (!req.admin) {
    return res.status(403).json({ error: "You are not authorized!" });
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  Meeting.deleteOne({ _id: id }, (err, result) => {
    if (err) throw err;
    if (result.deletedCount != 1) {
      return res.status(400).json({ error: "Meeting could not be found by that ID" });
    }
    return res.json({ success: "Successfully cancelled the meeting" });
  });
});

module.exports = router;
