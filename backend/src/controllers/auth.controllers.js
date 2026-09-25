import { UserModel } from "../models/user.model.js";
import { generateToken } from "../helpers/jwt.helper.js";
import { hashPassword, comparePassword } from "../helpers/bcrypt.helper.js";
import { publicUser } from "../helpers/serialize.helper.js";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  maxAge: 1000 * 60 * 60 * 12, // 12h, igual al expiresIn del token
};

const setSessionCookie = (res, user) => {
  const token = generateToken({ id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role });
  res.cookie("token", token, COOKIE_OPTS);
};

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, profile } = req.body;

    const exists = await UserModel.findOne({ where: { email: email.toLowerCase() } });
    if (exists) {
      return res.status(409).json({ message: "Ese correo ya tiene una cuenta. Probá iniciar sesión." });
    }

    const hashedPassword = await hashPassword(password);

    const user = await UserModel.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      supportType: role === "alumno" ? profile : null,
      cvdType: null,
      testDone: role === "alumno" ? profile !== "daltonismo" : true,
      filterOn: true,
    });

    setSessionCookie(res, user);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error al registrar usuario" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ message: "Correo o contraseña incorrectos." });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Correo o contraseña incorrectos." });
    }

    setSessionCookie(res, user);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const profile = async (req, res) => {
  const user = await UserModel.findByPk(req.user.id);
  if (!user) return res.status(401).json({ message: "No autenticado" });
  return res.json({ user: publicUser(user) });
};

export const updateMe = async (req, res) => {
  try {
    const { cvdType, testDone, filterOn } = req.body;
    const patch = {};
    if (cvdType !== undefined) patch.cvdType = cvdType;
    if (testDone !== undefined) patch.testDone = testDone;
    if (filterOn !== undefined) patch.filterOn = filterOn;

    await UserModel.update(patch, { where: { id: req.user.id } });
    const user = await UserModel.findByPk(req.user.id);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Sesión cerrada" });
};
