const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const pug = require('pug');

require('dotenv').config();

const options = {
  auth: {
    api_key: process.env.SENDGRID_API_KEY
  }
}
const client = nodemailer.createTransport(sgTransport(options));
const from = "justinparrondo@gmail.com";

module.exports = {
  sendRemindMail: (to, dateData) => {
    const dateOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: "America/New_York" 
    };
    const timeOptions = {
      hour12: true,
      hour: "numeric",
      minute: "numeric"
    }
    const html = pug.renderFile('src/server/emails/reminder.pug', {
      date: new Date(dateData.date).toLocaleDateString('en-US', dateOptions),
      startTime: dateData.startTime.toLocaleTimeString('en-US', timeOptions),
      endTime: dateData.endTime.toLocaleTimeString('en-US', timeOptions)
    });

    client.sendMail({
      from: from,
      to: to,
      subject: 'Meeting Reminder',
      html: html
    }, (err, info) => {
      if (err) console.log(err);
      console.log(info);
    });
  }
}
