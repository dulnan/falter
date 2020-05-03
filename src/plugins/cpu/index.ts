import ShellPlugin from '../shell'

interface CPUOutput {
  [key: string]: number
}

// Output from command:
const KEYS = [
  'user',
  'nice',
  'system',
  'idle',
  'iowait',
  'irq',
  'softirq',
  'steal',
  'guest',
  'guest_nice'
]

export default class CPUPlugin extends ShellPlugin {
  constructor() {
    super('cpu', `cat /proc/stat | grep 'cpu '`, 1000)
  }

  public parseOutput(output: string): any {
    const values = output
      .replace(/^\D+/gm, '')
      .split('\n')
      .filter(Boolean)[0]
      .split(' ')
      .map((v) => parseInt(v, 10))
      .reduce((acc: CPUOutput, v: number, i: number) => {
        const key = KEYS[i]
        acc[key] = v
        return acc
      }, {})

    values.time = Date.now()

    return values
  }
}
