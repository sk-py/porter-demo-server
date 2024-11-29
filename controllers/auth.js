const User = require("../models/user");

const handleSignup = async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ err: "Fields cannot be empty" });
  }

  const alreadyExist = await User.findOne({ $or: [{ username: username }] });

  console.log("username:", username);

  if (alreadyExist) {
    let errorMessage = "";

    if (alreadyExist.username === username) {
      errorMessage = "A user with this username already exists";
    }
    return res.status(409).json({ err: errorMessage });
  }

  const newUser = await User.create({
    username,
    password,
    role,
  });

  return res.status(201).json({
    username: newUser.username,
    role,
    msg: "Registration successfull",
  });
};

const handleLogin = async (req, res) => {
  const { username, password } = req.body;
  //   console.log(req.body);

  if (!username || !password) {
    return res.status(400).json({ err: "Fields cannot be empty" });
  }

  const doExists = await User.findOne({
    $or: [{ username: username }],
  });

  if (!doExists) {
    return res.status(404).json({ err: "Unregistered username" });
  }

  const Verified = password == doExists.password;

  if (!Verified) {
    return res.status(400).json({ err: "Incorrect password" });
  }

  if (Verified) {
    return res.status(200).json({
      username: doExists.username,
      role: doExists.role,
      msg: "Successfully signed in",
    });
  }

  return res
    .status(500)
    .json({ err: "An unexpected server error occurred please try again" });
};

module.exports = { handleSignup, handleLogin };
