const path = require("path");

// Lint-staged disabled - run linting manually with 'yarn lint' when ready
// To re-enable, uncomment the config below and uncomment the yarn lint-staged command in .husky/pre-commit

// const buildNextEslintCommand = (filenames) =>
//   `yarn next:lint --fix --file ${filenames
//     .map((f) => path.relative(path.join("packages", "nextjs"), f))
//     .join(" --file ")}`;

// const checkTypesNextCommand = () => "yarn next:check-types";

// const buildHardhatEslintCommand = (filenames) =>
//   `yarn hardhat:lint-staged --fix ${filenames
//     .map((f) => path.relative(path.join("packages", "hardhat"), f))
//     .join(" ")}`;

module.exports = {
  // Disabled - no linting on commit
  // "packages/nextjs/**/*.{ts,tsx}": [
  //   buildNextEslintCommand,
  //   checkTypesNextCommand,
  // ],
  // "packages/hardhat/**/*.{ts,tsx}": [buildHardhatEslintCommand],
};
