import { exec } from 'child_process'
import { Plugin } from '../base'
// cat /proc/meminfo

interface ShellCommandMap {
  [key: string]: NodeJS.Timeout
}

export default class ShellPlugin extends Plugin {
  private commands: ShellCommandMap = {}
  private command: string
  private intervalDuration: number

  constructor(namespace: string, command: string, interval = 0) {
    super(namespace)

    this.intervalDuration = interval
    this.command = command
    this.executeCommand(command)
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

  public executeCommand(command: string): void {
    const fn = () => {
      this.execute(command).then((output: string) => {
        const parsed = this.parseOutput(output)
        this.emit('update', parsed)
      })
    }

    if (this.intervalDuration) {
      this.commands[command] = setInterval(() => {
        fn()
      }, this.intervalDuration)
    } else {
      fn()
    }
  }
}
