import fs from "fs/promises";
import path from "path";
import { CourseModel } from "../models/course.model.js";
import { PostModel } from "../models/post.model.js";
import { adaptContent } from "../helpers/adapt.helper.js";
import { autoFormat, extractTextFromFile } from "../helpers/dyslexia.helper.js";
import { postFull } from "../helpers/serialize.helper.js";
import { UPLOADS_DIR } from "../middlewares/upload.middleware.js";

const EXT_BY_MIME = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export const createPost = async (req, res) => {
  const uploadedFile = req.file; // multer ya lo guardó en disco si vino uno
  try {
    const course = await CourseModel.findByPk(req.params.id);
    if (!course) return res.status(404).json({ message: "Materia no encontrada" });
    if (course.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Solo el profesor de la materia puede publicar acá" });
    }

    const { type, title, body, dueDate } = req.body;

    // El adjunto en PDF/Word solo tiene sentido en una tarea: es lo que se
    // reorganiza automáticamente para dislexia y se muestra con el botón
    // "Adaptado". El resto de los tipos de publicación no llevan archivo.
    if (uploadedFile && type !== "tarea") {
      await fs.unlink(uploadedFile.path).catch(() => {});
      return res.status(400).json({ message: "Solo podés adjuntar un archivo PDF o Word en una tarea." });
    }

    let fileName = null;
    let fileUrl = null;
    let fileType = null;
    let fileAdapted = null;

    if (uploadedFile) {
      fileType = EXT_BY_MIME[uploadedFile.mimetype] || null;
      try {
        const rawText = await extractTextFromFile(await fs.readFile(uploadedFile.path), fileType);
        const { html } = autoFormat(rawText);
        fileAdapted = html;
        fileName = uploadedFile.originalname;
        fileUrl = `/uploads/${path.basename(uploadedFile.path)}`;
      } catch (err) {
        await fs.unlink(uploadedFile.path).catch(() => {});
        const msg =
          err.message === "scan"
            ? "Ese PDF no tiene texto seleccionable (parece un escaneo). Pasalo antes por un OCR y volvé a subirlo."
            : "No se pudo leer ese archivo. Revisá que no esté dañado o protegido con contraseña.";
        return res.status(400).json({ message: msg });
      }
    }

    const post = await PostModel.create({
      courseId: course.id,
      authorId: req.user.id,
      type,
      title,
      body,
      dueDate: dueDate || null,
      fileName,
      fileUrl,
      fileType,
      fileAdapted,
      adaptStatus: "pending",
    });

    // Adaptamos el contenido antes de responder: así el alumno recibe la
    // publicación ya lista para su perfil (comprensión / dislexia / daltonismo).
    const adapted = await adaptContent({ title, body, type, courseName: course.name });
    await post.update({ adapted, adaptStatus: "ready" });
    post.comments = [];

    return res.status(201).json({ post: postFull(post) });
  } catch (error) {
    if (uploadedFile) await fs.unlink(uploadedFile.path).catch(() => {});
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
