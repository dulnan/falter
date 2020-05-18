import i3 from './plugins/i3'
import networkmanager from './plugins/networkmanager'
import spotify from './plugins/spotify'
import memory from './plugins/memory'
import CPUPlugin from './plugins/cpu'
import LauncherPlugin from './plugins/launcher'
import TemperaturePlugin from './plugins/temperature'
import Socket from './socket'

const socket = new Socket(9090)

socket.addPlugin(i3)
socket.addPlugin(spotify)
socket.addPlugin(networkmanager)
socket.addPlugin(memory)
socket.addPlugin(CPUPlugin)
socket.addPlugin(TemperaturePlugin)
socket.addPlugin(LauncherPlugin)
