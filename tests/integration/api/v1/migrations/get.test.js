import database from "infra/database.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await database.query("DROP SCHEMA PUBLIC CASCADE; CREATE SCHEMA PUBLIC;");
});

describe("GET /api/v1/migrations", () => {
  describe("Usuário anônimo", () => {
    test("Roda migrations pendentes", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");
      expect(response?.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody.length).toBeGreaterThan(0);
    });
  });
});
