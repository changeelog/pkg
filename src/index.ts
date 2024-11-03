import { defineExtension } from 'reactive-vscode'
import { commands, window } from 'vscode'
import { runPackageManagerCommand } from './packageManager'
import { logger } from './utils'

const { activate, deactivate } = defineExtension(() => {
  logger.info('Extension activated')

  const disposable = commands.registerCommand('changeelog.runPackageManager', async () => {
    const command = await window.showInputBox({
      prompt: 'Enter package manager command',
      placeHolder: 'e.g., install lodash',
    })

    if (command) {
      runPackageManagerCommand(command)
    }
  })

  return {
    dispose: () => {
      disposable.dispose()
    },
  }
})

export { activate, deactivate }
