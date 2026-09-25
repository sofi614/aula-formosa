import "dotenv/config";

import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { startDB } from "./src/config/database.js";
import { authRouter } from "./src/routes/auth.routes.js";
import { courseRouter } from "./src/routes/course.routes.js";
import { postRouter } from "./src/routes/post.routes.js";
import { submissionRouter } from "./src/routes/submission.routes.js";
import { commentRouter } from "./src/routes/comment.routes.js";

// Registra todos los modelos y sus asociaciones antes de sincronizar la DB.
import "./src/models/user.model.js";
import "./src/models/course.model.js";
import "./src/models/course_member.model.js";
import "./src/models/post.model.js";
import "./src/models/submission.model.js";
import "./src/models/comment.model.js";

const app = express();
const PORT = process.env.PORT || 3005;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Sirve los PDF/Word que suben los profesores (para poder descargar el
// original, además de ver la versión adaptada para dislexia).
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api", authRouter);
app.use("/api", courseRouter);
app.use("/api", postRouter);
app.use("/api", submissionRouter);
app.use("/api", commentRouter);

app.use((req, res) => res.status(404).json({ message: "Ruta no encontrada" }));

app.listen(PORT, async () => {
  await startDB();
  console.log(`Servidor de Aula Inclusiva corriendo en el puerto ${PORT}`);
});
