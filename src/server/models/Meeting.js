const mongoose = require('mongoose');
const fs = require('fs');
const Schema = mongoose.Schema;

function generateJoinCode() {
  return new Promise((resolve, reject) => {
    fs.readFile('src/server/wordlists/adjectives.txt', (err, data) => {
      if (err) throw err;
      const adjectiveFile = data.toString().split('\n');
      let randomAdjective = adjectiveFile[Math.floor(Math.random()*adjectiveFile.length)];
      randomAdjective = randomAdjective.charAt(0).toUpperCase() + randomAdjective.slice(1);
      fs.readFile('src/server/wordlists/animals.txt', (err, data) => {
        if (err) throw err;
        const animalFile = data.toString().split('\n');
        const randomAnimal = animalFile[Math.floor(Math.random()*animalFile.length)];
        resolve(randomAdjective + " " + randomAnimal);
      });
    })
  });
}

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
  joinCode: {
    type: String
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

MeetingSchema.pre('save', function(next) {
  const self = this;
  console.log(self);
  generateJoinCode().then((code) => {
    console.log(code);
    this.joinCode = code;
    console.log(this);
    next();
  });
});

module.exports = Meeting = mongoose.model("Meeting", MeetingSchema);
