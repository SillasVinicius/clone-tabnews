import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";

export default async function migrations(request, response) {
  if (request?.method !== "GET" && request?.method !== "POST") {
    return response
      .status(405)
      .json({ error: `Method ${request?.method} Not Allowed` });
  }

  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const dryRun = request?.method === "GET" ? true : false;

    const migrations = await migrationRunner({
      dbClient,
      dryRun,
      dir: join("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations ",
    });

    return response
      .status(dryRun ? 200 : migrations?.length > 0 ? 201 : 200)
      .json(migrations);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}
