import ShellPlugin from '../shell'

interface MemoryOutput {
  [key: string]: number
}

export default class MemoryPlugin extends ShellPlugin {
  constructor() {
    super('memory', 'cat /proc/meminfo', 5000)
  }

  public parseOutput(output: string): any {
    return output
      .split('\n')
      .map((line) => {
        const [key, value] = line.split(':').map((v) => v.trim())
        if (value !== undefined) {
          return { key, value: parseInt(value.split(' ')[0], 10) }
        }
      })
      .filter(Boolean)
      .reduce((acc: MemoryOutput, v: any) => {
        acc[v.key] = v.value
        return acc
      }, {})
  }
}
