const { Router } = require("express");
const multer = require('multer');
const path = require('path');
const {
  renderAddBlogPage,
  handleGetBlogById,
  handleCreateComment,
  handleCreateBlog,
  renderEditBlogPage,
  handleUpdateBlog,
  handleDeleteBlog,
  handleMyBlogs,
  handleToggleLike,
} = require("../controllers/blog");
const { requireAuth } = require("../middlewares/role");

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
  const allowedImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowedFontExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'coverImage') {
    if (allowedImageMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid image file type. Only JPEG, PNG, WEBP, and GIF are allowed.'));
  } else if (file.fieldname === 'fontFile') {
    if (allowedFontExtensions.includes(ext)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid font file type. Only TTF, OTF, WOFF, and WOFF2 files are allowed.'));
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  }
});

const blogUpload = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "fontFile", maxCount: 1 }
]);

router.get("/add-new", requireAuth, renderAddBlogPage);
router.get("/my-blogs", requireAuth, handleMyBlogs);
router.get("/edit/:id", requireAuth, renderEditBlogPage);
router.post("/edit/:id", requireAuth, blogUpload, handleUpdateBlog);
router.post("/delete/:id", requireAuth, handleDeleteBlog);
router.post("/:id/like", requireAuth, handleToggleLike);
router.get("/:id", handleGetBlogById);
router.post("/comment/:blogId", requireAuth, handleCreateComment);
router.post("/", requireAuth, blogUpload, handleCreateBlog);

module.exports = router;