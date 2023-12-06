const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Register
router.post("/register", async (req, res) => {
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
  });

  // Save user
  const result = await user.save();
  const { password, ...data } = await result.toJSON();

  res.send(data);
});

// Login
router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  // find email
  if (!user) {
    return res.status(404).send({
      message: "user not found",
    });
  }

  // compare password
  if (!(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(400).send({
      message: "invalid credentials",
    });
  }

  // set JWT
  const token = jwt.sign({ _id: user._id }, "secretkey");
  res.cookie("jwt", token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  // callback
  res.send({
    //jwt: token,
    message: "success",
  });
});

// Fetch user data
router.get("/user", async (req, res) => {
  try {
    const cookie = req.cookies["jwt"];

    const claims = jwt.verify(cookie, "secretkey");

    if (!claims) {
      return res.status(400).send({
        message: "unauthenticated",
      });
    }

    const user = await User.findOne({ _id: claims._id });
    const { password, ...data } = await user.toJSON();

    res.send(data);
  } catch (e) {
    return res.status(400).send({
      message: "unauthenticated",
    });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });

  res.send({ message: "logout success" });
});

module.exports = router;
