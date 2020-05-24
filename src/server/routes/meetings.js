const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const axios = require('axios');

require('dotenv').config();

const Meeting = require('../models/Meeting');
const Student = require('../models/Student.js');
const Admin = require('../models/Admin.js');

const notifier = require('../notifier.js');

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

      if (!req.admin) {
        for (let i = 0; i < meetings.length; i++) {
          meetings[i] = meetings[i].toObject();
          delete meetings[i].zoomMeetingStartLink;
        }
      }

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

const validateAndRenewAcessToken = (req, res, next) => {
  if (req.body.hasZoomMeeting) {
    if (!req.admin.zoomAccessToken) {
      return res.status(400).json({ error: 'Your Admin account is not linked with a Zoom account!' });
    }

    if (new Date() >= new Date(req.admin.zoomTokenExpireTime)) {
      const authHeader = Buffer.from(process.env.ZOOM_CLIENT_ID + ":" + process.env.ZOOM_CLIENT_SECRET).toString('base64');
      axios({
        method: 'POST',
        url: 'https://zoom.us/oauth/token',
        params: {
          grant_type: 'refresh_token',
          refresh_token: req.admin.zoomRefreshToken
        },
        headers: {
          'Authorization' : "Basic " + authHeader
        }
      }).then((response) => {
        const { data } = response;
        Admin.findById(req.admin.id, (err, admin) => {
          if (err) throw err;
          admin.zoomAccessToken = data.access_token;
          admin.zoomRefreshToken = data.refresh_token;
    
          let expireTime = new Date();
          expireTime.setSeconds(expireTime.getSeconds() + 3500);
          admin.zoomTokenExpireTime = expireTime.toISOString();
          
          admin.save((err) => {
            if (err) throw err;
            req.admin = admin;
            return next();
          });
        });
      }).catch((err) => {
        return res.status(403).json({ error: "Your Zoom access token was expiring but could not be refreshed. Your account may have been deleted or you might have revoked access to CCHS Coding Club Manager" });
      });
    } else {
      return next();
    }
  } else {
    return next();
  }
}

router.post('/', (req, res, next) => {
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
  return next();
}, validateAndRenewAcessToken, (req, res) => {
  if (req.body.hasZoomMeeting) {
    axios({
      method: 'POST',
      url: 'https://api.zoom.us/v2/users/me/meetings',
      headers: {
        'Authorization' : "Bearer " + req.admin.zoomAccessToken
      },
      data: {
        topic: "Coding and Cybersecurity Club",
        type: 2,
        start_time: req.body.startTime,
        timezone: 'UTC'
      }
    }).then((response) => {
      const { data } = response;
      console.log(data.join_url);
      const newMeeting = new Meeting({
        _id: new mongoose.Types.ObjectId(),
        date: req.body.date,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        zoomMeetingId: data.id,
        zoomMeetingStartLink: data.start_url,
        zoomMeetingInviteLink: data.join_url,
        zoomMeetingPassword: data.password,
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

        if (req.body.sendNotification) {
          notifier.sendEmails('schedule', newMeeting);
          notifier.sendDiscordMessage('schedue', newMeeting);
        };

        return res.json({
          success: "Meeting successfully created",
          newMeeting: newMeeting
        });
      });
    }).catch((err) => {
      console.error(err);
    });
  } else {
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

      if (req.body.sendNotification) {
        notifier.sendEmails('schedule', newMeeting);
        notifier.sendDiscordMessage('schedue', newMeeting);
      };

      return res.json({
        success: "Meeting successfully created",
        newMeeting: newMeeting
      });
    });
  }
});

router.put('/:id', (req, res, next) => {
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
  return next();
}, validateAndRenewAcessToken, (req, res) => {
  const { id } = req.params;
  Meeting.findOne({ _id: id }, (err, meeting) => {
    if (err) throw err;
    if (!meeting) return res.status(400).json({ error: "Meeting by that ID not found" });

    const oldMeeting = {
      date: meeting.date,
      startTime: meeting.startTime,
      endTime: meeting.endTime
    };

    meeting.lastEditedBy = req.admin._id;
    if (meeting.zoomMeetingId && req.body.startTime) {
      axios({
        method: 'PATCH',
        url: 'https://api.zoom.us/v2/meetings/' + meeting.zoomMeetingId,
        headers: {
          'Authorization' : "Bearer " + req.admin.zoomAccessToken
        },
        data: {
          start_time: req.body.startTime,
          timezone: 'UTC'
        }
      }).then((response) => {
        delete req.body.hasZoomMeeting;
        for (let field in req.body) {
          if (meeting[field]) {
            if (field == "attendants") {
              for (let i = 0; i < req.body[field].length; i++) {
                meeting[field].push(req.body[field][i]);
              }
            } else if (field) {
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
          if (req.body.sendNotification) {
            notifier.sendEmails('reschedule', meeting, oldMeeting);
            notifier.sendDiscordMessage('reschedule', meeting, oldMeeting);
          }
          return res.json({ success: "Succesfully updated meeting" });
        });
      }).catch((err) => {
        return res.status(500).json({ error: "Failed to re-schedule the Zoom meeting" });
      });
    } else {
      delete req.body.hasZoomMeeting;
      for (let field in req.body) {
        if (meeting[field]) {
          if (field == "attendants") {
            for (let i = 0; i < req.body[field].length; i++) {
              meeting[field].push(req.body[field][i]);
            }
          } else if (field) {
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
        if (req.body.sendNotification) {
          notifier.sendEmails('reschedule', meeting, oldMeeting);
          notifier.sendDiscordMessage('reschedule', meeting, oldMeeting);
        }
      });
    }
  });
});

router.delete('/:id', validateAndRenewAcessToken, (req, res) => {
  if (!req.admin) {
    return res.status(403).json({ error: "You are not authorized!" });
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }


  Meeting.findOne({ _id: id }, (err, meeting) => {
    if (!meeting) return res.status(400).json({ error: "Meeting could not be found by that ID" });

    Meeting.deleteOne({ _id: id }, (err, result) => {
      if (meeting.zoomMeetingId) {
        axios({
          method: 'DELETE',
          url: 'https://api.zoom.us/v2/meetings/' + meeting.zoomMeetingId,
          headers: {
            'Authorization' : "Bearer " + req.admin.zoomAccessToken
          },
          data: {
            schedule_for_reminder: false
          }
        }).then((response) => {
          if (req.body.sendNotification) {
            sendEmails('cancellation', meeting);
            sendDiscordMessage('cancellation', meeting);
          }
          return res.json({ success: "Successfully cancelled the meeting" });
        }).catch((err) => {
          console.error(err);
          return res.status(500).json({ error: "Could not cancel the Zoom meeting" });
        });
      } else {
        if (req.body.sendNotification) {
          sendEmails('cancellation', meeting);
          sendDiscordMessage('cancellation', meeting);
        }
        return res.json({ success: "Successfully cancelled the meeting" });
      }
    });
  });
});

module.exports = router;
