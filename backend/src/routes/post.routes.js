import { Router } from "express";
import { createPost } from "../controllers/post.controllers.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createPostValidation } from "../middlewares/validations/post.validation.js";
import { uploadTaskFile } from "../middlewares/upload.middleware.js";

export const postRouter = Router();

// uploadTaskFile solo actúa si la request viene como multipart/form-data
// (cuando el profesor adjunta un PDF/Word a una tarea); si viene como JSON
// normal, la deja pasar sin tocar req.body.
const handleUpload = (req, res, next) => {
  uploadTaskFile(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "No se pudo subir el archivo" });
    next();
  });
};

postRouter.post(
  "/courses/:id/posts",
  authMiddleware,
  requireRole("profesor"),
  handleUpload,
  createPostValidation,
  validate,
  createPost,
);
