import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED[file.mimetype] || (file.originalname.split(".").pop() || "bin").toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    cb(null, unique);
  },
});

// Solo PDF y Word: es lo único que puede adjuntar el profesor a una tarea.
const fileFilter = (req, file, cb) => {
  if (ALLOWED[file.mimetype]) return cb(null, true);
  cb(new Error("Solo se aceptan archivos PDF o Word (.docx)."));
};

export const uploadTaskFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
}).single("file");
