const { Router } = require("express");
const multer = require('multer');
const path = require('path');
const {
  renderAddBlogPage,
  handleGetBlogById,
  handleCreateComment,
  handleCreateBlog,
} = require("../controllers/blog");

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

const upload = multer({ storage: storage });

router.get("/add-new", renderAddBlogPage);

router.get("/:id", handleGetBlogById);

router.post("/comment/:blogId", handleCreateComment);

router.post("/", upload.single("coverImage"), handleCreateBlog);

module.exports = router;