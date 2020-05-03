import EventEmitter from 'eventemitter3'
import * as WebSocket from 'ws'
import { Plugin } from './../plugins/base'

export default class Socket extends EventEmitter {
  public readonly plugins: Plugin[]
  private readonly server: WebSocket.Server

  constructor(port: number) {
    super()

    this.plugins = []
    this.server = new WebSocket.Server({ port })
    this.server.on('connection', (socket: WebSocket) => {
      socket.on('message', this.onMessage.bind(this))

      this.plugins.forEach((plugin: Plugin) => {
        plugin.update().then((data: any) => {
          this.send(plugin.namespace, 'update', data)
        })
      })
    })
  }

  public addPlugin(plugin: any): void {
    this.createPluginInstance(plugin).then((instance: Plugin) => {
      instance.setEmitFunction((event: string, data: any) => {
        this.send(instance.namespace, event, data)
      })

      Object.keys(instance.events).forEach((key) => {
        this.on(
          instance.namespace + '_' + key,
          instance.events[key].bind(instance)
        )
      })
      this.plugins.push(instance)
    })
  }

  public createPluginInstance(plugin: any): Promise<Plugin> {
    if (plugin.create) {
      return plugin.create()
    }

    return Promise.resolve(new plugin())
  }

  public send(namespace: string, eventName: string, data: any): void {
    const event = (namespace ? namespace + '_' : '') + eventName

    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event, data }))
      }
    })
  }

  private onMessage(message: string): void {
    const { event, data } = JSON.parse(message)
    console.log(this.eventNames())
    this.emit(event, data)
  }
}
