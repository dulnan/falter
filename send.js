#!/bin/node

const ipc = require('node-ipc')

ipc.config.id = 'falter'
ipc.config.retry = 1500
ipc.config.silent = true
ipc.connectTo('falter', () => {
  ipc.of['falter'].on('connect', () => {
    ipc.of['falter'].emit('show_full', 'The message we send')
    process.exit()
  })
})

