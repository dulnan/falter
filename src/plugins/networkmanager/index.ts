import { Plugin } from '../base'
import NM from './NM'

export default class NetworkManager extends Plugin {
  public static create(): Promise<NetworkManager> {
    return NM.init().then((nm: NM) => {
      return new NetworkManager(nm)
    })
  }

  private nm: NM

  constructor(nm: NM) {
    super('networkmanager')
    this.nm = nm

    this.nm.on('change', (connections) => {
      this.emit('update', connections)
    })
  }

  public update(): Promise<any> {
    return this.nm.getConnections()
  }
}
