const dotenv = require("dotenv");
const nextJest = require("next/jest");

dotenv.config({
  path: ".env.development",
});

const createJestCondig = nextJest({
  dir: ".",
});
const jestConfig = createJestCondig({
  moduleDirectories: ["node_modules", "<rootDir>"],
});

module.exports = jestConfig;
