import database from "../../../../infra/database.js";

export default async function status(request, response) {
  const result = await database.query("SELECT 1 + 1 AS SUM;");
  console.log(result.rows);
  response
    .status(200)
    .json({ chave: "Alunos do curso.dev são pessoas acima da média" });
}
