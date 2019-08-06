const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require('dotenv').config();

const Admin = require('../models/Admin');

const validateRegisterFields = (req, res, next) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  if (!req.body.name) {
    return res.status(400).json({ error: "Name is required" });
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
  let newAdmin = new Admin({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  });
  if (req.body.masterPassword != process.env.MASTER_PASSWORD) {
    return res.status(403).json({ error: "Master password incorrect" });
  }
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newAdmin.password, salt, (err, hash) => {
      newAdmin.password = hash;
      // Try and save the mongoose object
      newAdmin.save((err, newStudent) => {
        if (err) {
          let { message } = err;
          if (err.code === 11000) {
            message = "This email is already registered!";
          }
          return res.status(403).json({ error: message });
        }
        // Create a JSON Web Token storing the id of the new ClubOwner document
        jwt.sign({"id": newAdmin._id }, process.env.SECRET, (err, token) => {
          if (err) { throw err; }
          res.cookie('adminAccessJwt', token, { httpOnly: true });
          return res.json({ success: "Token set in adminAccessJwt cookie" });
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
  Admin.findOne({ email: req.body.email }, (err, admin) => {
    if (err) throw err;
    if (!admin) { return res.status(403).json({ error: "Email and/or password incorrect" }); }
    // If it does, check the password
    bcrypt.compare(req.body.password, admin.password, (err, result) => {
      if (!result) { return res.status(403).json({ error: "Email and/or password incorrect" }); }

      // If the password is correct, respond with the token
      jwt.sign({"id": admin._id }, process.env.SECRET, (err, token) => {
        if (err) { throw err; }

        res.cookie('adminAccessJwt', token, { httpOnly: true });
        return res.json({ success: "Token set in adminAccessJwt cookie" });
      });
    });
  });
});

router.get('/logout', (req, res) => {
  res.clearCookie('adminAccessJwt', { httpOnly: true });
  res.json({ success: "Succesfully logged out" });
});

router.get('/', (req, res) => {
  if (req.admin) {
    let admin = req.admin.toObject();
    delete admin.password;

    return res.json({
      user: admin
    });
  } else {
    Student.find({}, (err, admins) => {
      let responseAdmins = [];
      for (let i = 0; i < admins.length; i++) {
        let currAdmin = admins[i].toObject();
        delete currAdmin.password;
        responseAdmins.push(currAdmin);
      }
      return res.json({
        status: "noStudentToken",
        students: responseAdmins
      });
    });
  }
});

const protectRoute = (req, res, next) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  if (!req.admin || req.admin._id != id) {
    return res.status(403).json({ error: "You are not authorized!" });
  } else {
    return next();
  }
}

router.get('/:id', protectRoute, (req, res) => {
  Admin.findOne({ _id: req.params.id }, (err, admin) => {
    if (err) throw err;
    if (!admin) return res.status(400).json({ error: "Student could not be found by that ID" });
    let responseAdmin = admin.toObject();
    delete responseAdmin.password;
    return res.json({
      student: adminStudent
    });
  });
});

const validateUpdateFields = (req, res, next) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  if (req.body.email) {
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ error: "Invalid email" });
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
  Admin.findById(req.params.id, (err, admin) => {
    if (err) { throw err; }
    if (req.body.oldPassword) {
      bcrypt.compare(req.body.oldPassword, admin.password, (err, result) => {
        if (!result) { return res.status(403).json({ error: "Old password is incorrect "}); }
        Admin.updateOne({ _id: req.params.id }, newData, (err) => {
          if (err) { throw err; }
          return res.json({ success: "Successfully updated Admin account" });
        });
      });
    } else {
      Admin.updateOne({ _id: req.params.id }, newData, (err) => {
        if (err) { throw err; }
        return res.json({ success: "Successfully updated Admin account" });
      });
    }
  });
});

router.delete('/:id', protectRoute, (req, res) => {
  Admin.deleteOne({ _id: req.params.id}, (err) => {
    if (err) { return res.status(500).json({ error: "Admin account could not be deleted "})}
    res.clearCookie('adminAccessJwt', { httpOnly: true });
    return res.json({ success: "Admin successfully deleted "});
  });
});

module.exports = router;
