const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require('dotenv').config();

const Student = require('../models/Student');

const validateRegisterFields = (req, res, next) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  const phoneRegex = /^\d{10}$/;

  if (!req.body.name) {
    return res.status(400).json({ error: "Name is required" });
  } else if (!req.body.phone || !phoneRegex.test(req.body.phone)) {
    return res.status(400).json({ error: "Invalid phone number" });
  } else if (!req.body.email || !emailRegex.test(req.body.email)) {
    return res.status(400).json({ error: "Invalid email" });
  } else if (!req.body.password || !passwordRegex.test(req.body.password)) {
    return res.status(400).json({ error: "Password must be at least 8 characters, with at least one letter and one number" });
  } else {
    next();
  }
};

router.post("/register", validateRegisterFields, (req, res) => {
  // Create ClubOWner Object
  let newStudent = new Student({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,
    group: null,
    password: req.body.password
  });
  // Use bcrypt to create a hashed password
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newStudent.password, salt, (err, hash) => {
      newStudent.password = hash;
      // Try and save the mongoose object
      newStudent.save((err, newStudent) => {
        if (err) {
          let { message } = err;
          if (err.code === 11000) {
            message = "This email is already registered!";
          }
          return res.status(403).json({ error: message });
        }
        // Create a JSON Web Token storing the id of the new ClubOwner document
        jwt.sign({"id": newStudent._id }, process.env.SECRET, (err, token) => {
          if (err) { throw err; }
          res.cookie('studentAccessJwt', token, { httpOnly: true });
          return res.json({ success: "Token set in studentAccessJwt cookie" });
        });
      });
    });
  });
});

const validateLoginFields = (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ error: "Email and/or password incorrect" });
  } else {
    next();
  }
}

router.post('/login', validateLoginFields, (req, res) => {
  // Check if a ClubOwner with the email exists
  Student.findOne({ email: req.body.email }, (err, student) => {
    if (err) throw err;
    if (!student) { return res.status(403).json({ error: "Email and/or password incorrect" }); }
    // If it does, check the password
    bcrypt.compare(req.body.password, student.password, (err, result) => {
      if (!result) { return res.status(403).json({ error: "Email and/or password incorrect" }); }

      // If the password is correct, respond with the token
      jwt.sign({"id": student._id }, process.env.SECRET, (err, token) => {
        if (err) { throw err; }

        res.cookie('studentAccessJwt', token, { httpOnly: true });
        return res.json({ success: "Token set in studentAccessJwt cookie" });
      });
    });
  });
});

router.get('/logout', (req, res) => {
  res.clearCookie('studentAccessJwt', { httpOnly: true });
  res.json({ success: "Succesfully logged out" });
});

router.get('/', (req, res) => {
  if (req.student) {
    let student = req.student.toObject();
    delete student.password;

    return res.json({
      user: student
    });
  } else {
    Student.find({}, (err, students) => {
      let responseStudents = [];
      for (let i = 0; i < students.length; i++) {
        let currStudent = students[i].toObject();
        delete currStudent.password;
        responseStudents.push(currStudent);
      }
      return res.json({
        status: "noStudentToken",
        students: responseStudents
      });
    });
  }
});

const protectRoute = (req, res, next) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  if ((!req.student || req.student._id != id) && !req.admin) {
    return res.status(403).json({ error: "You are not authorized!" });
  } else {
    return next();
  }
}

router.get('/:id', protectRoute, (req, res) => {
  Student.findOne({ _id: req.params.id }, (err, student) => {
    if (err) throw err;
    if (!student) return res.status(400).json({ error: "Student could not be found by that ID" });
    let responseStudent = student.toObject();
    delete responseStudent.password;
    return res.json({
      student: responseStudent
    });
  });
});

const validateUpdateFields = (req, res, next) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  const phoneRegex = /^\d{10}$/;

  if (req.body.email) {
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ error: "Invalid email" });
    }
  }
  if (req.body.phone) {
    let parsedPhone = "";
    for (let i = 0; i < req.body.phone.length; i++) {
      if ('0123456789'.indexOf(req.body.phone[i]) !== -1) {
        parsedPhone += req.body.phone[i];
      }
    }
    req.body.phone = parsedPhone;
    if (!phoneRegex.test(req.body.phone)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }
  }
  if (req.body.newPassword) {
    if (!req.body.oldPassword) {
      return res.status(400).json({ error: "Old password is required"});
    }
    if (!passwordRegex.test(req.body.newPassword)) {
      return res.status(400).json({ error: "New password must be at least 8 characters, with at least one letter and one number" });
    }
  }
  next();
}

router.put('/:id', validateUpdateFields, protectRoute, (req, res) => {
  const newData = {};
  if (req.body.name) {
    newData.name = req.body.name;
  }
  if (req.body.phone) {
    newData.phone = req.body.phone;
  }
  if (req.body.email) {
    newData.email = req.body.email;
  }
  if (req.body.newPassword) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.newPassword, salt);
    console.log(hash);
    newData.password = hash;
  }
  Student.findById(req.params.id, (err, student) => {
    if (err) { throw err; }
    if (req.body.oldPassword) {
      bcrypt.compare(req.body.oldPassword, student.password, (err, result) => {
        if (!result) { return res.status(403).json({ error: "Old password is incorrect "}); }
        Student.updateOne({ _id: req.params.id }, newData, (err) => {
          if (err) { throw err; }
          return res.json({ success: "Successfully updated Student account" });
        });
      });
    } else {
      Student.updateOne({ _id: req.params.id }, newData, (err) => {
        if (err) { throw err; }
        return res.json({ success: "Successfully updated Student account" });
      });
    }
  });
});

router.delete('/:id', protectRoute, (req, res) => {
  Student.deleteOne({ _id: req.params.id}, (err) => {
    if (err) { return res.status(500).json({ error: "Student account could not be deleted "})}
    res.clearCookie('studentAccessJwt', { httpOnly: true });
    return res.json({ success: "Student successfully deleted "});
  });
});

module.exports = router;
