const ipc = require('node-ipc')

import EventEmitter from 'eventemitter3'
import * as WebSocket from 'ws'
import { Plugin } from './../plugins/base'

ipc.config.id = 'falter'
ipc.config.retry = 1500
ipc.config.silent = true

export default class Socket extends EventEmitter {
  public readonly plugins: Plugin[]
  private readonly server: WebSocket.Server

  constructor(port: number) {
    super()

    this.plugins = []
    this.server = new WebSocket.Server({ port })
    this.server.on('connection', (socket: WebSocket) => {
      socket.on('message', (message: string) => this.onMessage(message, socket))
    })

    ipc.serve(() =>
      ipc.server.on('show_full', () => {
        this.send('faltbar', 'show', 'full')
      })
    )
    ipc.server.start()
  }

  public addPlugin(plugin: any): void {
    this.createPluginInstance(plugin).then((instance: Plugin) => {
      instance.setEmitFunction((event: string, data: any) => {
        this.send(instance.namespace, event, data)
      })

      instance.init()

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

  public send(namespace: string, event: string, data: any): void {
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ namespace, event, data }))
      }
    })
  }

  private onMessage(message: string, socket: WebSocket): void {
    const { event, namespace, data } = JSON.parse(message)
    if (namespace === 'falter' && event === 'subscribe') {
      this.subscribe(data, socket)
    }
    const eventName = [namespace, event].join('_')
    console.log(eventName, data)
    this.emit(eventName, data)
  }

  private subscribe(namespace: string, socket: WebSocket): void {
    const plugin = this.plugins.find((p) => p.namespace === namespace)
    if (!plugin) {
      return
    }

    plugin.update().then((data: any) => {
      socket.send(
        JSON.stringify({
          namespace: 'falter',
          event: 'subscribed',
          data: { namespace, data }
        })
      )
    })
  }
}
