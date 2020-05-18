import DesktopEntry from './desktopParser'
import fs from 'fs'
import { exec } from 'child_process'
import { Plugin } from '../base'

function executeCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { shell: '/bin/bash' }, (error, stdout, stderr) => {
      if (error) {
        reject(error.message)
        return
      } else if (stderr) {
        reject(stderr)
      } else {
        resolve(stdout)
      }
    })
  })
}

export default class LauncherPlugin extends Plugin {
  private output: any[]

  constructor() {
    super('launcher')

    this.output = []
  }

  public update(): Promise<any> {
    return Promise.resolve({ applications: this.output })
  }

  public init(): Promise<void> {
    return executeCommand(
      `find /usr/share/applications ~/.local/share/applications -name '*.desktop'`
    )
      .then((output) => {
        return Promise.all(
          output
            .split('\n')
            .filter(Boolean)
            .map((path) => {
              const matches = /^.+\/(.*)\.desktop/.exec(path) || []
              return fs.promises.readFile(path).then((buffer) => ({
                ...new DesktopEntry(buffer.toString()).JSON,
                id: matches[1] || ''
              }))
            })
        )
      })
      .then((result) => {
        const seen = new Map()

        result.forEach((item: any) => {
          const key = item.id + item.name + item.exec

          if (!seen.has(key)) {
            this.output.push(item)
            seen.set(key, true)
          }
        })
        return
      })
  }
}
