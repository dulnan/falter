import ShellPlugin from '../shell'

interface TemperatureOutput {
  [key: string]: number
}

export default class TemperaturePlugin extends ShellPlugin {
  constructor() {
    super(
      'temperature',
      `paste -d : <(cat /sys/class/thermal/thermal_zone*/type) <(cat /sys/class/thermal/thermal_zone*/temp) | column -s $'\t' -t`,
      1000
    )
  }

  public parseOutput(output: string): any {
    const values = output
      .split('\n')
      .filter(Boolean)
      .reduce((acc: TemperatureOutput, v: string) => {
        const [key, value] = v.split(':')
        acc[key] = parseInt(value, 10)
        return acc
      }, {})

    return values
  }
}
