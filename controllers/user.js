const User = require('../models/user');

async function handleSignin(req, res) {
  const { email, password } = req.body;
  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);
    // Hardening auth cookies: httpOnly: true
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
    
    // Auto-login after signup: matchPasswordAndGenerateToken
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

module.exports = {
  handleSignin,
  handleSignup,
  handleLogout,
};
