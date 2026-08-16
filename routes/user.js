const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const {
  handleSignin,
  handleSignup,
  handleLogout,
  handleGetProfile,
  renderSettingsPage,
  handleUpdateSettings,
} = require('../controllers/user');
const { requireAuth } = require('../middlewares/role');

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  }
});

router.get('/signin', (req, res) => {
   return res.render('signin');
});

router.get('/signup', (req, res) => {
   return res.render('signup');
});

router.post('/signin', handleSignin);
router.get('/logout', handleLogout);
router.post('/signup', handleSignup);

router.get('/profile/:id', requireAuth, handleGetProfile);
router.get('/settings', requireAuth, renderSettingsPage);
router.post('/settings', requireAuth, upload.single('profileImage'), handleUpdateSettings);

module.exports = router;