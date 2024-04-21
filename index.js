#!/usr/bin/env node
import * as fs from "fs";
import { spawn } from "child_process";
import * as readline from "readline";

// Define the files to detect for each package manager

const packageManagerFiles = {
  bun: "bun.lockb",
  pnpm: "pnpm-lock.yaml",
  npm: "package-lock.json",
  yarn: "yarn.lock",
};

// Define the command formats for each package manager

const packageManagerCommands = {
  bun: "bun",
  pnpm: "pnpm",
  npm: "npm",
  yarn: "yarn",
};

// Function to run the command based on the detected package manager
function runCommand(packageManager, command, dryRun) {
  const [packageManagerCommand, ...commandArgs] = command.split(" ");
  if (
    packageManager === "npm" &&
    !["run", "exec"].includes(packageManagerCommand)
  ) {
    command = `${packageManagerCommand} ${commandArgs.join(" ")}`;
  }
  if (dryRun) {
    console.log(
      `[Dry Run] Running command: ${packageManagerCommands[packageManager]} ${command}`
    );
    return;
  }
  const child = spawn(
    packageManagerCommands[packageManager],
    command.split(" "),
    {
      stdio: "inherit",
      shell: true,
    }
  );
  child.on("error", (error) => {
    console.error(`Error executing command: ${error.message}`);
    process.exit(1);
  });
  child.on("close", (code) => {
    process.exit(code ?? 0);
  });
}

// Function to detect the package manager based on the presence of specific files
function detectPackageManager() {
  for (const [packageManager, file] of Object.entries(packageManagerFiles)) {
    if (fs.existsSync(file)) {
      return packageManager;
    }
  }
  return "bun"; // Default to bun if no lockfile is found
}

// Function to check the Node.js version
function checkNodeVersion() {
  const requiredVersion = ">=18.0.0";
  const currentVersion = process.version;
  if (currentVersion < requiredVersion) {
    console.warn(
      `Your Node.js version (${currentVersion}) is outdated. Please upgrade to at least ${requiredVersion}.`
    );
  }
}

// Function to read commands from a configuration file
function readCommandsFromConfig() {
  const configFile = "runfile.json";
  if (fs.existsSync(configFile)) {
    const config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
    return config.commands || [];
  }
  return [];
}

// Function to prompt the user for package manager selection
async function promptPackageManager() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(
      "Please select a package manager (bun, pnpm, npm, yarn): ",
      (answer) => {
        rl.close();
        resolve(answer);
      }
    );
  });
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const options = {
    manager: "",
    silent: false,
    debug: false,
    dryRun: false,
  };
  // Parse command line options
  let commandIndex = 0;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--manager") {
      options.manager = args[i + 1];
      i++;
    } else if (args[i] === "--silent") {
      options.silent = true;
    } else if (args[i] === "--debug") {
      options.debug = true;
    } else if (args[i] === "--dry-run") {
      options.dryRun = true;
    } else {
      commandIndex = i;
      break;
    }
  }
  const commands = args.slice(commandIndex);
  if (commands.length === 0) {
    const configCommands = readCommandsFromConfig();
    if (configCommands.length > 0) {
      commands.push(...configCommands);
    } else {
      console.log("Please provide a command to run");
      return;
    }
  }
  checkNodeVersion();
  let packageManager = options.manager;
  if (!packageManager) {
    packageManager = detectPackageManager();
    if (!packageManager) {
      if (!options.silent) {
        console.log("Unable to detect package manager");
      }
      packageManager = await promptPackageManager();
    }
  }
  if (!options.silent) {
    console.log(`Selected package manager: ${packageManager}`);
  }
  for (const command of commands) {
    runCommand(packageManager, command, options.dryRun);
  }
}
main();
