import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { handler } from "../netlify/functions/breakevens-data.mjs";

const outputPath = resolve(process.env.BREAKEVENS_DATA_OUTPUT || "public/api/breakevens-data.json");

const result = await handler({
  httpMethod: "GET",
  queryStringParameters: { refresh: "1" }
});

if ((result.statusCode ?? 500) >= 400) {
  throw new Error(result.body || `Data generation failed with status ${result.statusCode}`);
}

const data = JSON.parse(result.body);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(data)}\n`, "utf8");

console.log(`Wrote ${outputPath}`);
console.log(
  `Fantasy players: ${data.platforms.fantasy.players.length}; SuperCoach players: ${data.platforms.supercoach.players.length}`
);
