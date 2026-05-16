/* routes/settingsRoutes.js */
const router   = require('express').Router();
const multer   = require('multer');
const path     = require('path');
const { v4: uuidv4 } = require('uuid');
const {
  getProfile, updateProfile, updatePassword, updateAvatar,
  getNotifications, updateNotifications,
  getAppearance, updateAppearance,
  clearProgress, deleteAccount,
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

/* ── Multer for avatar uploads ── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || 2) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  },
});

router.use(protect);

router.get('/profile',        getProfile);
router.put('/profile',        updateProfile);
router.put('/password',       updatePassword);
router.post('/avatar',        upload.single('avatar'), updateAvatar);
router.get('/notifications',  getNotifications);
router.put('/notifications',  updateNotifications);
router.get('/appearance',     getAppearance);
router.put('/appearance',     updateAppearance);
router.delete('/clear-progress', clearProgress);
router.delete('/account',     deleteAccount);

module.exports = router;