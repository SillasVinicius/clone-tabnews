import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";
import session from "model/session";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Usuário padrão", () => {
    test("Com sessão válida", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser?.id);

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject?.token}`,
        },
      });

      expect(response?.status).toBe(200);

      const cacheControl = response.headers.get("Cache-Control");

      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithValidSession",
        email: createdUser?.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      //Session Renewal Assertions
      const renewSessionObject = await session.findOneValidByToken(
        sessionObject?.token,
      );

      expect(
        renewSessionObject?.expires_at > sessionObject?.expires_at,
      ).toEqual(true);

      expect(
        renewSessionObject?.updated_at > sessionObject?.updated_at,
      ).toEqual(true);

      //Set-Cookie Assertions
      const parsedSetCookie = setCookieParser(response, { map: true });

      expect(parsedSetCookie?.session_id).toEqual({
        name: "session_id",
        value: sessionObject?.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });
    test("Com sessão não existente", async () => {
      const nonexistentToken =
        "be29c81726d183f563473767603f2ac6d749a16d0526115383143b4efa704e54bdc933f85ab908242c5600f80b2673d5";

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${nonexistentToken}`,
        },
      });

      expect(response?.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "O usuário não possui sessão ativa.",
        action: "verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
    });
    test("Com sessão expirada", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser?.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject?.token}`,
        },
      });

      expect(response?.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "O usuário não possui sessão ativa.",
        action: "verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
    });
  });
});
