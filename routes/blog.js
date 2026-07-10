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

router.get("/add-new", requireAuth, renderAddBlogPage);
router.get("/my-blogs", requireAuth, handleMyBlogs);
router.get("/edit/:id", requireAuth, renderEditBlogPage);
router.post("/edit/:id", requireAuth, upload.single("coverImage"), handleUpdateBlog);
router.post("/delete/:id", requireAuth, handleDeleteBlog);
router.post("/:id/like", requireAuth, handleToggleLike);
router.get("/:id", handleGetBlogById);
router.post("/comment/:blogId", requireAuth, handleCreateComment);
router.post("/", requireAuth, upload.single("coverImage"), handleCreateBlog);

module.exports = router;