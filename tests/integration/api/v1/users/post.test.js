import database from "infra/database";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Usuário anônimo", () => {
    test("Com dados únicos e válidos", async () => {
      await database.query({
        text: "INSERT INTO users (username, email, password) VALUES ($1, $2, $3);",
        values: ["sillasbraga", "sillas.braga@gmail.com", "senha123"],
      });

      const users = await database.query("SELECT * FROM users;");
      console.log(users.rows);
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
      });
      expect(response?.status).toBe(201);
    });
  });
});
