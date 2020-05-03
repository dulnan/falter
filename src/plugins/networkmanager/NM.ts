import EventEmitter from 'eventemitter3'
const nodeNetworkManager = require('node-networkmanager')

const getAccessPointInfo = async (AccessPoint) => {
  const ssid = await action(AccessPoint, 'GetSsid')
  const strength = await action(AccessPoint, 'GetStrength')

  return { ssid, strength }
}

const getDeviceInfo = async (Device) => {
  // Device.on('StateChanged', function (newState, oldState, reason) {
  //   if (newState) console.log('Device state changed: ' + newState.description)
  //   if (reason) console.log('Device reason: ' + reason.description)
  // })
  //
  // Device.GetCapabilities(function (error, Capabilities) {
  //   console.log(Capabilities.description)
  // })

  const type = await action(Device, 'GetDeviceType')
  const IP = await getIP(Device)
  return { type, IP }
}

async function getIP(Device) {
  const IPv4 = await action(Device, 'GetIp4Config').then((Ip4Config) => {
    return action(Ip4Config, 'GetAddresses').then((data = {}) => {
      return data.map((ip = {}) => {
        return { ...ip }
      })
    })
  })
  const IPv6 = await action(Device, 'GetIp6Config').then((Ip6Config) => {
    return action(Ip6Config, 'GetAddresses')
  })

  return { IPv4, IPv6 }
}

const getSettingsConnectionInfo = function (SettingsConnection) {
  return new Promise((resolve, reject) => {
    SettingsConnection.GetSettings(null, function (error, Settings) {
      resolve(Settings)
    })
  })
}

async function getActiveConnectionInfo(ActiveConnection): Promise<any> {
  const accessPoint = await action(ActiveConnection, 'GetSpecificObject').then(
    (SpecificObject) => {
      if (SpecificObject) {
        return getAccessPointInfo(SpecificObject)
      }
    }
  )

  const devices = await action(ActiveConnection, 'GetDevices').then(
    (Devices) => {
      return Promise.all(
        Devices.map((Device) => {
          return getDeviceInfo(Device)
        })
      )
    }
  )

  const connection = await action(ActiveConnection, 'GetConnection').then(
    (SettingsConnection) => {
      return getSettingsConnectionInfo(SettingsConnection).then(
        (v) => v.connection
      )
    }
  )

  return { accessPoint, connection, devices }
}
function action(iface: any, method: string): Promise<any> {
  return new Promise((resolve, reject) => {
    iface[method]((error: any, data: object) => {
      if (error) {
        reject(error)
      } else {
        resolve(data)
      }
    })
  })
}

export default class NM extends EventEmitter {
  static init(): Promise<NM> {
    return new Promise((resolve, reject) => {
      nodeNetworkManager.connect(async (error: any, instance: any) => {
        if (error) {
          reject(error)
        } else {
          resolve(new NM(instance.NetworkManager))
        }
      })
    })
  }

  private nm: any
  private timeout: any

  constructor(networkmanager: any) {
    super()

    this.nm = networkmanager
    this.timeout = null

    this.nm.on('StateChanged', (newState: any, oldState: any) => {
      if (typeof oldState == 'undefined' || newState.code != oldState.code) {
        clearTimeout(this.timeout)
        this.timeout = setTimeout(() => {
          this.getConnections().then((connections) => {
            this.emit('change', connections)
          })
        }, 500)
      }
    })
  }

  public getConnections(): Promise<any> {
    return action(this.nm, 'GetActiveConnections').then(
      (connections: any[]) => {
        return Promise.all(
          connections.map((connection) => {
            console.log(connection)
            return getActiveConnectionInfo(connection)
          })
        )
      }
    )
  }
}
