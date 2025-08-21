import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors";
import password from "./password";

async function runInsertQuery({ username, email, password }) {
  const results = await database.query({
    text: "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *;",
    values: [username, email, password],
  });
  return results?.rows[0];
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: "SELECT email FROM users WHERE LOWER(email) = LOWER($1);",
    values: [email],
  });

  if (results?.rowCount > 0) {
    throw new ValidationError({
      message: "O email informado já está sendo utilizado.",
      action: "Utilize outro email para realizar o cadastro.",
    });
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: "SELECT username FROM users WHERE LOWER(username) = LOWER($1);",
    values: [username],
  });

  if (results?.rowCount > 0) {
    throw new ValidationError({
      message: "O nome de usuário informado já está sendo utilizado.",
      action: "Utilize outro nome de usuário para realizar o cadastro.",
    });
  }
}

async function runSelectQuery(username) {
  const results = await database.query({
    text: "SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1 ;",
    values: [username],
  });

  if (results?.rowCount === 0) {
    throw new NotFoundError({
      message: "O nome de usuário informado não foi encontrado no sistema.",
      action: "Verifique se o nome de usuário está digitado corretamente.",
    });
  }

  return results.rows[0];
}

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);
  return userFound;
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues?.password);
  userInputValues.password = hashedPassword;
}

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues?.email);
  await validateUniqueUsername(userInputValues?.username);
  await hashPasswordInObject(userInputValues);
  const newUser = await runInsertQuery(userInputValues);
  return newUser;
}

const user = {
  create,
  findOneByUsername,
};

export default user;
