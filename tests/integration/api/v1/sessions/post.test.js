import session from "model/session";
import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("Com email incorreto mas senha correta", async () => {
      await orchestrator.createUser({
        password: "senha-correta",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.errado@gmail.com",
          password: "senha-correta",
        }),
      });

      expect(response?.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });
    test("Com email correto mas senha incorreta", async () => {
      await orchestrator.createUser({
        email: "email.correto@curso.dev",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.correto@curso.dev",
          password: "senha-incorreta",
        }),
      });

      expect(response?.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });
    test("Com email e senha incorretos", async () => {
      await orchestrator.createUser({});

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.incorreto@curso.dev",
          password: "senha-incorreta",
        }),
      });

      expect(response?.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });
    test("Com email e senha corretos", async () => {
      const createdUser = await orchestrator.createUser({
        email: "tudo.correto@curso.dev",
        password: "tudocorreto",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "tudo.correto@curso.dev",
          password: "tudocorreto",
        }),
      });

      expect(response?.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody?.id,
        token: responseBody?.token,
        user_id: createdUser?.id,
        expires_at: responseBody?.expires_at,
        created_at: responseBody?.created_at,
        updated_at: responseBody?.updated_at,
      });

      expect(uuidVersion(responseBody?.id)).toBe(4);
      expect(uuidVersion(createdUser?.id)).toBe(4);
      expect(Date.parse(responseBody?.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody?.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody?.updated_at)).not.toBeNaN();

      const expiresAt = new Date(responseBody?.expires_at);
      const createdAt = new Date(responseBody?.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(session?.EXPIRATION_IN_MILLISECONDS);

      const parsedSetCookie = setCookieParser(response, { map: true });

      expect(parsedSetCookie?.session_id).toEqual({
        name: "session_id",
        value: responseBody?.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
