const CronJob = require('cron').CronJob;
const Discord = require('discord.js');
const client = new Discord.Client();
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const pug = require('pug');
const moment = require('moment');

const Meeting = require('./models/Meeting');
const Student = require('./models/Student');
const Admin = require('./models/Admin');

require('dotenv').config();

const DAYS_OF_THE_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const MONTHS_OF_THE_YEAR = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let channel;
const initializeDiscordBot = () => {
  return new Promise((resolve, reject) => {
    if (!channel) {
      client.login(process.env.DISCORD_BOT_TOKEN);
      client.once('ready', () => {
        channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
        resolve(channel)
      });
    } else {
      resolve(channel);
    }
  }).catch(() => {
    console.error("Could not initialize bot!");
  });
}


const generateMessage = (messageType, meeting, oldMeeting) => {
  let localizedStartTime = new Date(meeting.startTime);
  let localizedEndTime = new Date(meeting.endTime);
  localizedStartTime.setUTCMinutes(localizedStartTime.getMinutes() - localizedStartTime.getTimezoneOffset());
  localizedEndTime.setUTCMinutes(localizedEndTime.getMinutes() - localizedEndTime.getTimezoneOffset());
  
  const startTimeString = new moment(localizedStartTime).utc().format('hh:mm a');
  const endTimeString = new moment(localizedEndTime).utc().format('hh:mm a');

  let title = '';
  let message = '';
  if (messageType == 'reminder') {
    title = "Meeting Reminder ("+ (localizedStartTime.getUTCMonth()+1) + "/" + localizedStartTime.getUTCDate() + ")";
    message = "This is an automated reminder of a Coding and Cybersecurity Club Meeting on "
      + DAYS_OF_THE_WEEK[localizedStartTime.getUTCDay()] + ", " + MONTHS_OF_THE_YEAR[localizedStartTime.getUTCMonth()] + " " + localizedStartTime.getUTCDate() + ".";
  } else if (messageType == 'schedule') {
    title = "Meeting Scheduled ("+ (localizedStartTime.getUTCMonth()+1) + "/" + localizedStartTime.getUTCDate() + ")";
    message = "This is a notification of a Coding and Cybersecurity Club Meeting scheduled on "
    + DAYS_OF_THE_WEEK[localizedStartTime.getUTCDay()] + ", " + MONTHS_OF_THE_YEAR[localizedStartTime.getUTCMonth()] + " " + localizedStartTime.getUTCDate() + ".";
  } else if (messageType == 'reschedule') {
    let oldLocalizedStartTime = new Date(oldMeeting.startTime);
    let oldLocalizedEndTime = new Date(oldMeeting.endTime);
    oldLocalizedStartTime.setUTCMinutes(oldLocalizedStartTime.getMinutes() - oldLocalizedStartTime.getTimezoneOffset());
    oldLocalizedEndTime.setUTCMinutes(oldLocalizedEndTime.getMinutes() - oldLocalizedEndTime.getTimezoneOffset());
    let oldLocalizedStartTimeString = new moment(oldLocalizedStartTime).utc().format('hh:mm a');
    let oldLocalizedEndTimeString = new moment(oldLocalizedEndTime).utc().format('hh:mm a');

    title = "Meeting Re-Scheduled (" + (oldLocalizedStartTime.getUTCMonth()+1) + "/" + oldLocalizedStartTime.getUTCDate() + ") to ("
      + (localizedStartTime.getUTCMonth()+1) + "/" + localizedStartTime.getUTCDate() + ")";
    message = "This is a notification that the Coding and Cybersecurity Club Meeting previously scheduled on "
      + DAYS_OF_THE_WEEK[oldLocalizedStartTime.getUTCDay()] + ", " + MONTHS_OF_THE_YEAR[oldLocalizedStartTime.getUTCMonth()] + " " + oldLocalizedStartTime.getUTCDate()
      + " from " + oldLocalizedStartTimeString + " to " + oldLocalizedEndTimeString + " has been rescheduled to " + DAYS_OF_THE_WEEK[localizedStartTime.getUTCDay()]
      + ", " + MONTHS_OF_THE_YEAR[localizedStartTime.getUTCMonth()] + " " + localizedStartTime.getUTCDate() + ".";
  } else if (messageType == 'cancellation') {
    title = "Meeting Cancelled (" + (localizedStartTime.getUTCMonth()+1) + "/" + localizedStartTime.getUTCDate() + ")";
    message = "This is a notification that the meeting previously scheduled for " + DAYS_OF_THE_WEEK[localizedStartTime.getUTCDay()] 
              + ", " + MONTHS_OF_THE_YEAR[localizedStartTime.getUTCMonth()] + " " + localizedStartTime.getUTCDate()
              + " from " + startTimeString + " to " + endTimeString + " has been cancelled.";
  }
  let footer = "This message was automatically generated and sent by the cchs-coding.club app. If there are any problems with this bot, please contact my creator Justin Parrondo";
  
  return {
    title: title,
    message: message,
    startTime: startTimeString,
    endTime: endTimeString,
    zoomMeetingInviteLink: meeting.zoomMeetingInviteLink,
    zoomMeetingPassword: meeting.zoomMeetingPassword,
    footer: footer
  };
}

const sendDiscordMessage = async (messageType, meeting, oldMeeting) => {
  await initializeDiscordBot();
  const messageData = generateMessage(messageType, meeting, oldMeeting);

  const embedMessage = {
    title: messageData.title,
    url: 'https://cchs-coding.club/meetings',
    description: "@everyone " + messageData.message,
    fields: [
      {
        name: "Start Time",
        value: messageData.startTime
      },
      {
        name: "End Time",
        value: messageData.endTime
      }
    ],
    footer: {
      text: messageData.footer
    }
  }

  if (messageData.zoomMeetingInviteLink && messageData.zoomMeetingPassword) {
    embedMessage.fields.push(
      { 
        name: "Zoom Meeting Join Link",
        value: messageData.zoomMeetingInviteLink
      },
      {
        name: "Zoom Meeting Password",
        value: messageData.zoomMeetingPassword
      }
    );
  }
  channel.send({ embed: embedMessage });
}

const mailClient = nodemailer.createTransport(sgTransport({ 
  auth: {
    api_key: process.env.SENDGRID_API_KEY
  }
}));
const from = "bot@cchs-coding.club";
const fromname = "CCHS-Coding.club Bot";

const sendEmails = async (messageType, meeting, oldMeeting) => {
  const messageData = generateMessage(messageType, meeting, oldMeeting);
  const html = pug.renderFile('src/server/emails/reminder.pug', messageData);

  Student.find({}, (err, students) => {
    students.forEach((student) => {
      mailClient.sendMail({
        from: from,
        fromname: fromname,
        to: student.email,
        subject: messageData.title,
        html: html
      }, (err, info) => {
        if (err) console.log(err);
        console.log(info);
      });
    });
  });
  
  Admin.find({}, (err, admins) => {
    admins.forEach((admin) => {
      mailClient.sendMail({
        from: from,
        fromname: fromname,
        to: admin.email,
        subject: messageData.title,
        html: html
      }, (err, info) => {
        if (err) console.log(err);
        console.log(info);
      });
    });
  });
}

const sendTestEmail = async (messageType, meeting, oldMeeting) => {
  const messageData = generateMessage(messageType, meeting, oldMeeting);
  const html = pug.renderFile('src/server/emails/reminder.pug', messageData);

  mailClient.sendMail({
    from: from,
    fromname: fromname,
    to: "justinparrondo@gmail.com",
    subject: messageData.title,
    html: html
  }, (err, info) => {
    if (err) console.log(err);
    console.log(info);
  });
}

const notifyDailyOfMeetings = new CronJob('0 0 * * *', () => {
  let localizedDate = new Date();
  localizedDate.setUTCMinutes(localizedDate.getMinutes() - localizedDate.getTimezoneOffset());
  localizedDate.setHours(0);
  localizedDate.setMinutes(0);
  localizedDate.setSeconds(0);
  localizedDate.setMilliseconds(0);

  Meeting.findOne({ date: localizedDate.toISOString() }, (err, meeting) => {
    if (err) throw err;
    if (meeting) {
      sendDiscordMessage('reminder', meeting);
      sendEmails('reminder', meeting);
    }
  });
}, null, true, 'America/New_York');

exports.sendDiscordMessage = sendDiscordMessage;
exports.sendEmails = sendEmails;
exports.sendTestEmail = sendTestEmail;