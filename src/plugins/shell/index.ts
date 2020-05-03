import { exec } from 'child_process'
import { Plugin } from '../base'
// cat /proc/meminfo

interface ShellCommandMap {
  [key: string]: NodeJS.Timeout
}

export default class ShellPlugin extends Plugin {
  private commands: ShellCommandMap = {}
  private command: string

  constructor(namespace: string, command: string, interval = 5000) {
    super(namespace)

    this.command = command
    this.executeCommand(command, interval)
  }

  public execute(command: string): Promise<string> {
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

  public update(): Promise<any> {
    return this.execute(this.command).then(this.parseOutput)
  }

  public parseOutput(output: string): any {
    return output
  }

  public executeCommand(command: string, interval: number): void {
    this.commands[command] = setInterval(() => {
      this.execute(command).then((output: string) => {
        const parsed = this.parseOutput(output)
        this.emit('update', parsed)
      })
    }, interval)
  }
}
