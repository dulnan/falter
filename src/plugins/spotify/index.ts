import { Plugin } from '../base'

const DBus = require('dbus')
const bus = DBus.getBus('session')
const spotify = {
  service: 'org.mpris.MediaPlayer2.spotify',
  objectPath: '/org/mpris/MediaPlayer2',
  interfaces: [
    'org.mpris.MediaPlayer2.Player',
    'org.freedesktop.DBus.Properties'
  ]
}

const getInterface = (interfacePath: string): any => {
  return new Promise((resolve, reject) => {
    bus.getInterface(
      spotify.service,
      spotify.objectPath,
      interfacePath,
      (err: any, iface: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(iface)
        }
      }
    )
  })
}

const parseData = (data: any): object => {
  return {
    isPlaying: data.PlaybackStatus === 'Playing',
    trackID: data.Metadata['mpris:trackid'],
    length: data.Metadata['mpris:length'],
    artUrl: data.Metadata['mpris:artUrl'],
    album: data.Metadata['xesam:album'],
    albumArtist: data.Metadata['xesam:albumArtist'],
    autoRating: data.Metadata['xesam:autoRating'],
    discNumber: data.Metadata['xesam:discNumber'],
    title: data.Metadata['xesam:title'],
    trackNumber: data.Metadata['xesam:trackNumber'],
    url: data.Metadata['xesam:url'],
    canGoNext: data.CanGoNext,
    canGoPrevious: data.CanGoPrevious,
    canPlay: data.CanPlay,
    canPause: data.CanPause,
    canSeek: data.CanSeek,
    canControl: data.CanControl
  }
}

export default class SpotifyPlugin extends Plugin {
  public static create(): Promise<SpotifyPlugin> {
    return getInterface(spotify.interfaces[0]).then((interfacePlayer: any) => {
      return getInterface(spotify.interfaces[1]).then((interfaceProps: any) => {
        return new SpotifyPlugin(interfacePlayer, interfaceProps)
      })
    })
  }
  private readonly interfacePlayer: any
  private readonly interfaceProps: any

  constructor(interfacePlayer: any, interfaceProps: any) {
    super('spotify')

    this.interfacePlayer = interfacePlayer
    this.interfaceProps = interfaceProps

    this.interfaceProps.on('PropertiesChanged', () => {
      this.getProperties().then((data: any) => {
        this.emit('update', data)
      })
    })

    this.addEventListener('play', () => this.interfacePlayer.Play())
    this.addEventListener('pause', () => this.interfacePlayer.Pause())
    this.addEventListener('stop', () => this.interfacePlayer.Stop())
    this.addEventListener('next', () => this.interfacePlayer.Next())
    this.addEventListener('prev', () => this.interfacePlayer.Previous())
  }

  public getProperties(): Promise<any> {
    return new Promise((resolve: any, reject: any) => {
      this.interfacePlayer.getProperties((err: any, data: object) => {
        if (err) {
          reject(err)
        } else {
          resolve(parseData(data))
        }
      })
    })
  }

  public update(): Promise<any> {
    return this.getProperties()
  }
}
