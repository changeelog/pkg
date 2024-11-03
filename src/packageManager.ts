import * as fs from 'node:fs'
import type { Terminal } from 'vscode'
import { window, workspace } from 'vscode'
import { logger } from './utils'

interface PackageManagerFiles {
  [key: string]: string
}

const packageManagerFiles: PackageManagerFiles = {
  bun: 'bun.lockb',
  pnpm: 'pnpm-lock.yaml',
  npm: 'package-lock.json',
  yarn: 'yarn.lock',
}

function detectPackageManager(): string {
  const workspaceFolders = workspace.workspaceFolders
  if (!workspaceFolders) {
    return 'pnpm' // Default to pnpm if no workspace folder is open
  }

  const rootPath = workspaceFolders[0].uri.fsPath

  for (const [packageManager, file] of Object.entries(packageManagerFiles)) {
    if (fs.existsSync(`${rootPath}/${file}`)) {
      return packageManager
    }
  }

  return 'pnpm' // Default to pnpm if no lockfile is found
}

let terminal: Terminal | undefined

export function runPackageManagerCommand(command: string): void {
  const packageManager = detectPackageManager()
  logger.info(`Detected package manager: ${packageManager}`)

  if (!terminal) {
    terminal = window.createTerminal('Package Manager')
  }

  terminal.show()

  let finalCommand = `${packageManager} ${command}`
  if (packageManager === 'npm' && !command.startsWith('run') && !command.startsWith('exec')) {
    finalCommand = `npm ${command}`
  }

  terminal.sendText(finalCommand)
}
