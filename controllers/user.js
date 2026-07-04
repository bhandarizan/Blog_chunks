const User = require('../models/user');
const Blog = require('../models/blog');

async function handleSignin(req, res) {
  const { email, password } = req.body;
  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);
    return res.cookie("token", token, { httpOnly: true }).redirect("/");
  } catch (err) {
    return res.render("signin", {
      error: "Invalid email or password",
    });
  }
}

async function handleSignup(req, res) {
  const { fullName, email, password } = req.body;
  
  if (!fullName || !email || !password) {
    return res.render("signup", {
      error: "All fields are required",
    });
  }
  
  try {
    await User.create({ fullName, email, password });
    
    const token = await User.matchPasswordAndGenerateToken(email, password);
    return res.cookie("token", token, { httpOnly: true }).redirect("/");
  } catch (err) {
    console.error("Signup error:", err);
    let errorMessage = "Failed to create account. Please try again.";
    if (err.code === 11000) {
      errorMessage = "An account with this email address already exists.";
    } else if (err.message) {
      errorMessage = err.message;
    }
    return res.render("signup", {
      error: errorMessage,
    });
  }
}

function handleLogout(req, res) {
  return res.clearCookie('token').redirect("/");
}

async function handleGetProfile(req, res) {
  try {
    const profileUser = await User.findById(req.params.id);
    if (!profileUser) {
      return res.redirect('/');
    }
    const blogs = await Blog.find({ createdBy: profileUser._id, status: 'published' })
      .sort({ createdAt: -1 });
    
    return res.render('profile', {
      user: req.user,
      profileUser,
      blogs,
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return res.redirect('/');
  }
}

function renderSettingsPage(req, res) {
  return res.render('settings', {
    user: req.user,
  });
}

async function handleUpdateSettings(req, res) {
  const { fullName } = req.body;
  try {
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (req.file) updateData.profileImageURL = `/uploads/${req.file.filename}`;

    await User.findByIdAndUpdate(req.user._id, updateData);

    return res.redirect(`/user/profile/${req.user._id}`);
  } catch (err) {
    console.error("Error updating settings:", err);
    return res.render('settings', {
      user: req.user,
      error: "Failed to update settings.",
    });
  }
}

module.exports = {
  handleSignin,
  handleSignup,
  handleLogout,
  handleGetProfile,
  renderSettingsPage,
  handleUpdateSettings,
};
