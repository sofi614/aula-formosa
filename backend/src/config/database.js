import { Sequelize } from "sequelize";

// conexion a la base de datos
export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
  },
);

// testear la conexion y sincronizar los modelos
export const startDB = async () => {
  try {
    await sequelize.authenticate();
    // ⚠ force:true recrea las tablas en cada arranque: perfecto para
    // desarrollo/demo, cambiar a false (o usar migraciones) en producción.
    await sequelize.sync({ force: process.env.DB_RESET === "true" });
    console.log("Conexion a la db esta lista");
  } catch (error) {
    console.error("No se pudo conectar a la db:", error);
  }
};
