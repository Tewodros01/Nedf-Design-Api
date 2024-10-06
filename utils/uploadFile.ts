import multer from "multer";
import path from "path";

// Configure Multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Files will be saved in the 'uploads' directory
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Customize the filename
    }
});

export const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Optional: Validate file types (e.g., allow only images)
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only images are allowed!') as any, false); // Return an error for non-image files
    } else {
      cb(null, true);
    }
  }
});
