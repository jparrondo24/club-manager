const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MeetingSchema = new Schema({
  _id: Schema.Types.ObjectId,
  date: {
    type: Date,
    required: true,
    unique: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  attendants: {
    type: [Schema.Types.ObjectId],
    ref: 'Student'
  },
  lastEditedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  },
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

module.exports = Meeting = mongoose.model("Meeting", MeetingSchema);
