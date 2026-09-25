import { PostModel } from "../models/post.model.js";
import { CourseModel } from "../models/course.model.js";
import { UserModel } from "../models/user.model.js";
import { SubmissionModel } from "../models/submission.model.js";
import { submissionFull } from "../helpers/serialize.helper.js";

// El alumno entrega (o actualiza su entrega de) una tarea.
export const submitTask = async (req, res) => {
  try {
    const post = await PostModel.findByPk(req.params.id, {
      include: [{ model: CourseModel, as: "course", include: [{ model: UserModel, as: "members" }] }],
    });
    if (!post || post.type !== "tarea") return res.status(404).json({ message: "Tarea no encontrada" });

    const isMember = post.course.members.some((m) => m.id === req.user.id);
    if (!isMember) return res.status(403).json({ message: "No sos parte de esta materia" });

    const { text, fileName } = req.body;

    // findOrCreate + update en vez de upsert(): más predecible entre motores
    // de base de datos que un ON DUPLICATE KEY con MySQL vía Sequelize.
    let submission = await SubmissionModel.findOne({ where: { postId: post.id, studentId: req.user.id } });
    if (submission) {
      await submission.update({ text, fileName: fileName || null, submittedAt: new Date() });
    } else {
      submission = await SubmissionModel.create({
        postId: post.id,
        studentId: req.user.id,
        text,
        fileName: fileName || null,
        submittedAt: new Date(),
      });
    }

    return res.json({ submission: submissionFull(submission) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// El profesor califica una entrega (y opcionalmente deja un comentario privado).
export const gradeSubmission = async (req, res) => {
  try {
    const submission = await SubmissionModel.findByPk(req.params.id, {
      include: [{ model: PostModel, as: "post", include: [{ model: CourseModel, as: "course" }] }],
    });
    if (!submission) return res.status(404).json({ message: "Entrega no encontrada" });
    if (submission.post.course.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Solo el profesor de la materia puede calificar" });
    }

    const { grade, feedback } = req.body;
    await submission.update({ grade, feedback: feedback || "" });

    return res.json({ submission: submissionFull(submission) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
