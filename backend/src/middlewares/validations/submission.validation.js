import { body } from "express-validator";

export const submitTaskValidation = [
  body("text").trim().notEmpty().withMessage("Escribí tu desarrollo antes de entregar"),
  body("fileName").optional({ nullable: true }).isString(),
];

export const gradeValidation = [
  body("grade").isInt({ min: 1, max: 10 }).withMessage("La nota debe ser un número entre 1 y 10"),
  body("feedback").optional({ nullable: true, checkFalsy: true }).isString(),
];
