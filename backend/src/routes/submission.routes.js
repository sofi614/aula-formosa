import { Router } from "express";
import { gradeSubmission, submitTask } from "../controllers/submission.controllers.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { gradeValidation, submitTaskValidation } from "../middlewares/validations/submission.validation.js";

export const submissionRouter = Router();

submissionRouter.post("/posts/:id/submissions", authMiddleware, requireRole("alumno"), submitTaskValidation, validate, submitTask);
submissionRouter.put("/submissions/:id/grade", authMiddleware, requireRole("profesor"), gradeValidation, validate, gradeSubmission);
