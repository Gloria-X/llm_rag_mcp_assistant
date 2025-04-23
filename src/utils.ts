import chalk from "chalk";

export function log(message: string) {
  console.log(chalk.green(`\n[${new Date().toLocaleTimeString()}] === ${message} ===`));
}