// @ts-nocheck
const nodei3 = require('i3')
import { Plugin } from '../base'

function parseWorkspace(windows: any[], nodes: any[]) {
  nodes.forEach((node) => {
    if (node.window_properties) {
      windows.push(node)
    } else if (node.nodes) {
      parseWorkspace(windows, node.nodes)
    }
  })
}

function parseTree(acc: any, nodes: any[]) {
  return nodes.map((node) => {
    if (node.type === 'workspace') {
      const windows = []
      parseWorkspace(windows, node.nodes)
      if (node.num >= 0) {
        acc[node.name] = {
          num: node.num,
          windows: windows.map((w) => {
            return {
              id: w.id,
              properties: w.window_properties,
              rect: w.rect
            }
          })
        }
      }
    }
    if (node.nodes.length) {
      return parseTree(acc, node.nodes)
    }
  })
}

export default class I3 extends Plugin {
  private readonly i3: any
  private workspaces: any
  private tree: any

  constructor() {
    super('wm')

    this.i3 = nodei3.createClient()
    this.i3.on('workspace', this.onWorkspace.bind(this))
    this.i3.on('window', this.onWindow.bind(this))

    this.workspaces = []
    this.tree = {}

    this.addEventListener('switch', this.switchToWorkspace)
  }

  public update(): Promise<any> {
    return this.getItems().then((workspaces) => {
      return { workspaces, focused: {} }
    })
  }

  public getWorkspaces(): Promise<object> {
    return new Promise((resolve) => {
      this.i3.workspaces((_payload: any, data: object) => {
        resolve(data)
      })
    })
  }

  public getTree(): Promise<object> {
    return new Promise((resolve) => {
      this.i3.tree((_payload: any, data: object) => {
        const acc = {}
        parseTree(acc, data.nodes)
        resolve(acc)
      })
    })
  }

  public switchToWorkspace(workspaceNumber: number): void {
    this.i3.command('workspace number ' + workspaceNumber)
  }

  private getItems() {
    return this.getWorkspaces().then((workspaces) => {
      return this.getTree().then((tree) => {
        return workspaces.map((ws) => {
          const windows = (tree[ws.name] || {}).windows || []
          return { ...ws, windows }
        })
      })
    })
  }

  private async onWorkspace(): void {
    const workspaces = await this.getItems()
    this.emit('update', { workspaces })
  }

  private onWindow(data) {
    if (data.change === 'focus') {
      this.emit('update', {
        focused: { id: data.id, ...data.container.window_properties }
      })
    }
  }
}
