import { body } from "express-validator";

export const registerValidation = [
  body("firstName").trim().notEmpty().withMessage("El nombre no debe ser vacío"),
  body("lastName").trim().notEmpty().withMessage("El apellido no debe ser vacío"),
  body("email").trim().notEmpty().withMessage("El email no debe ser vacío").isEmail().withMessage("El email debe ser válido"),
  body("password").isLength({ min: 4 }).withMessage("La contraseña necesita al menos 4 caracteres"),
  body("role").isIn(["profesor", "alumno"]).withMessage("El rol debe ser 'profesor' o 'alumno'"),
  body("profile")
    .if(body("role").equals("alumno"))
    .isIn(["comprension", "dislexia", "daltonismo", "ninguno"])
    .withMessage("Elegí qué tipo de apoyo necesitás"),
];

export const loginValidation = [
  body("email").trim().notEmpty().withMessage("El email no debe ser vacío"),
  body("password").notEmpty().withMessage("La contraseña no debe ser vacía"),
];

export const updateMeValidation = [
  body("cvdType").optional({ nullable: true }).isString(),
  body("testDone").optional().isBoolean(),
  body("filterOn").optional().isBoolean(),
];
