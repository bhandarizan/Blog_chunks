const User = require('../models/user');
const Blog = require('../models/blog');
const { createTokenForUser } = require('../services/auth');
const xss = require('xss');

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

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.render("signup", {
      error: "Invalid email format.",
    });
  }

  if (password.length < 6) {
    return res.render("signup", {
      error: "Password must be at least 6 characters long.",
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

async function renderSettingsPage(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.redirect('/user/signin');
    return res.render('settings', {
      user,
    });
  } catch (err) {
    console.error("Error rendering settings page:", err);
    return res.redirect('/');
  }
}

async function handleUpdateSettings(req, res) {
  const fullName = req.body.fullName ? req.body.fullName.trim() : "";
  const bio = req.body.bio ? req.body.bio.trim() : "";
  const twitterURL = req.body.twitterURL ? req.body.twitterURL.trim() : "";
  const githubURL = req.body.githubURL ? req.body.githubURL.trim() : "";
  const websiteURL = req.body.websiteURL ? req.body.websiteURL.trim() : "";
  const password = req.body.password;

  let user;
  try {
    user = await User.findById(req.user._id);
    if (!user) return res.redirect('/user/signin');
  } catch (err) {
    console.error("Error finding user:", err);
    return res.redirect('/');
  }

  if (!fullName) {
    return res.render('settings', {
      user,
      error: "Full name is required.",
    });
  }

  if (bio.length > 200) {
    return res.render('settings', {
      user,
      error: "Bio must be less than 200 characters.",
    });
  }

  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
  if (twitterURL && !urlRegex.test(twitterURL)) {
    return res.render('settings', {
      user,
      error: "Invalid Twitter/X URL format.",
    });
  }
  if (githubURL && !urlRegex.test(githubURL)) {
    return res.render('settings', {
      user,
      error: "Invalid GitHub URL format.",
    });
  }
  if (websiteURL && !urlRegex.test(websiteURL)) {
    return res.render('settings', {
      user,
      error: "Invalid Website URL format.",
    });
  }

  if (password && password.length < 6) {
    return res.render('settings', {
      user,
      error: "Password must be at least 6 characters long.",
    });
  }

  try {
    user.fullName = xss(fullName);
    user.bio = xss(bio);
    user.twitterURL = twitterURL ? xss(twitterURL) : "";
    user.githubURL = githubURL ? xss(githubURL) : "";
    user.websiteURL = websiteURL ? xss(websiteURL) : "";

    if (req.file) {
      user.profileImageURL = `/uploads/${req.file.filename}`;
    }

    if (password) {
      user.password = password; // Trigger hashing in pre-save hook
    }

    await user.save();

    // Re-generate token and update cookie
    const token = createTokenForUser(user);
    return res.cookie("token", token, { httpOnly: true }).redirect(`/user/profile/${user._id}`);
  } catch (err) {
    console.error("Error updating settings:", err);
    return res.render('settings', {
      user,
      error: "Failed to update settings. Please try again.",
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
