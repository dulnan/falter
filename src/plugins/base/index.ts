interface PluginEvents {
  [key: string]: PluginEventListener
}

export type PluginEventListener = (data: any) => void

export class Plugin {
  public readonly namespace: string
  public emit: any
  public events: PluginEvents = {}

  constructor(namespace: string) {
    this.namespace = namespace
  }

  public setEmitFunction(emit: any): void {
    this.emit = emit
  }

  public addEventListener(event: string, listener: PluginEventListener): void {
    this.events[event] = listener
  }

  public update(): Promise<any> {
    return Promise.resolve()
  }
}
