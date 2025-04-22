import chalk from "chalk";

export function log(message: string) {
  console.log(chalk.green(`[${new Date().toLocaleTimeString()}] === ${message} ===`));
}