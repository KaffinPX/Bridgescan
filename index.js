const viteJS = require('@vite/vitejs')
const viteJS_WS = require('@vite/vitejs-ws')
const viteJS_HTTP = require('@vite/vitejs-http')

const Web3 = require('web3')

const config = require('./storage/config.json')

const lmdb = require('lmdb')
const ws = require('ws')

const db = lmdb.open({ path: 'storage/db.lmdb' })
const wss = new ws.WebSocketServer({ port: 8080 })

const nodeCache = {
  bscHeight: db.openDB('cache').get('bscHeight') ?? '1'
}

config.networks.VITE.channels.list.forEach(channel => {
  nodeCache['viteHeight_' + channel.tokenId] = db.openDB('cache').get('viteHeight_' + channel.tokenId) ?? '1'
})

const socketPool = new Set()

socketPool.announce = (type, data) => {
  socketPool.forEach(ws => {
    if (type === 'bridging') {
      ws.send(JSON.stringify({
        method: 'bridging',
        data
      }))
    } else if (type === 'bridgingUpdate') {
      ws.send(JSON.stringify({
        method: 'bridgingUpdate',
        data
      }))
    }
  })
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ method: 'welcome' }))

  ws.on('message', (data) => {
    try {
      const request = JSON.parse(data)

      if (request.method === 'subscribe') {
        socketPool.add(ws)
      }

      if (request.method === 'queryAddress') {
        ws.send(JSON.stringify({
          method: request.method,
          data: db.openDB('history').get(request.data[0].toLowerCase())
        }))
      }

      if (request.method === 'getBridging') {
        ws.send(JSON.stringify({
          method: request.method,
          data: db.openDB('bridge').get(request.data[0])
        }))
      }
    } catch (err) { ws.send(JSON.stringify({ error: err.stack })) }
  })

  ws.on('close', () => {
    if (socketPool.has(ws)) {
      socketPool.delete(ws)
    }
  })
})

const rpcApi = new viteJS.ViteAPI(new viteJS_HTTP.HTTP_RPC(config.networks.VITE.nodeRPCAddress))
const api = new viteJS.ViteAPI(new viteJS_WS.WS_RPC(config.networks.VITE.nodeAddress, 6e5, { retryTimes: Infinity, retryInterval: 10000 }), () => {
  api._provider._timeout = 6e5
  const signatures = {}; config.networks.VITE.channels.abi.forEach(f => { if (f.type !== 'event') return; signatures[viteJS.abi.encodeLogSignature(f)] = f })

  const channelRanges = { addressHeightRange: {} }

  config.networks.VITE.channels.list.forEach(channel => {
    channelRanges.addressHeightRange[channel.address] = { fromHeight: nodeCache['viteHeight_' + channel.tokenId], toHeight: '0' }

    api.subscribe('createVmlogSubscription', { addressHeightRange: { [channel.address]: { fromHeight: '0', toHeight: '0' } } }).then((event) => {
      console.log(`[VITE] Subscribed ${channel.tokenId} successfully!`)

      event.on((results) => {
        for (const result of results) {
          const f = signatures[result.vmlog.topics[0]]
          if (!f) return

          const decoded = viteJS.abi.decodeLog(
            f.inputs,
            Buffer.from(result.vmlog.data ? result.vmlog.data : '', 'base64').toString('hex'),
            result.vmlog.topics.slice(1, result.vmlog.topics.length)
          )

          const data = {}
          for (const input of f.inputs) {
            data[input.name] = decoded[input.name]
          }

          if (f.name === 'Input') {
            rpcApi.request('ledger_getAccountBlockByHash', result.accountBlockHash).then(block => {
              socketPool.announce('bridging', {
                id: data.id,
                network: [ "VITE", "BSC" ],
                hash: [result.accountBlockHash],
                index: parseInt(data.index),
                sender: data.from,
                recipient: '0x' + data.dest,
                tokenId: channel.tokenId,
                amount: data.amount
              })

              db.openDB('bridge').putSync(data.id, {
                id: data.id,
                network: [ "VITE", "BSC" ],
                hash: [result.accountBlockHash],
                sender: data.from,
                recipient: '0x' + data.dest,
                tokenId: config.networks.VITE.channels.list.find((channel) => channel.address === result.address).tokenId,
                amount: data.value,
                timestamp: block.timestamp
              })

              const cache = {
                sender: db.openDB('history').get(data.from) ?? new Array(),
                recipient: db.openDB('history').get('0x' + data.dest) ?? new Array()
              }

              cache.sender.push(data.id)
              cache.recipient.push(data.id)

              db.openDB('history').putSync(data.from, cache.sender)
              db.openDB('history').putSync('0x' + data.dest, cache.recipient)
            })
          } else if (f.name === 'Output') {
            socketPool.announce('updateBridging', {
              id: data.id,
              status: true
            })

            const cache = db.openDB('bridge').get(data.id) ?? {}

            cache.status = true

            cache[1] = result.accountBlockHash

            db.openDB('bridge').putSync(data.id, cache)
          }
        }
      })
    })
  })

  rpcApi.request('ledger_getVmLogsByFilter', channelRanges).then(results => {
    if (results === null) return

    results.forEach(async result => {
      const abiItem = config.networks.VITE.channels.abi.find((item) => viteJS.abi.encodeLogSignature(item) === result.vmlog.topics[0])
      if (!abiItem) return

      const data = viteJS.abi.decodeLog(
        config.networks.VITE.channels.abi,
        Buffer.from(result.vmlog.data ? result.vmlog.data : '', 'base64').toString('hex'),
        result.vmlog.topics.slice(1, result.vmlog.topics.length),
        abiItem?.name
      )

      if (abiItem.name === 'Input') {
        rpcApi.request('ledger_getAccountBlockByHash', result.accountBlockHash).then(block => {
          db.openDB('bridge').putSync(data.id, {
            id: data.id,
            network: [ "VITE", "BSC" ],
            hash: [result.accountBlockHash,
              db.openDB('bridge').get(data.id)?.hash?.[1]],
            sender: data.from,
            recipient: '0x' + data.dest,
            tokenId: block.tokenInfo.tokenSymbol,
            amount: data.value,
            status: db.openDB('bridge').get(data.id)?.status ?? false,
            timestamp: block.timestamp
          })

          const cache = {
            sender: db.openDB('history').get(data.from) ?? new Array(),
            recipient: db.openDB('history').get('0x' + data.dest) ?? new Array()
          }

          cache.sender.push(data.id)
          cache.recipient.push(data.id)

          db.openDB('history').putSync(data.from, cache.sender)
          db.openDB('history').putSync('0x' + data.dest, cache.recipient)
        })
      } else if (abiItem.name === 'Output') {
        const cache = db.openDB('bridge').get(data.id) ?? {}

        cache.status = true

        if (typeof cache.hash === 'object') {
          cache.hash[1] = result.accountBlockHash
        } else {
          cache.hash = new Array()
          cache.hash[1] = result.accountBlockHash
        }

        db.openDB('bridge').putSync(data.id, cache)
      }
    })
  })
})

const web3 = new Web3(config.networks.BSC.nodeAddress)

web3.currentProvider.on('connect', () => {
  let genesisTimestamp
  const blockTime = 3 // TODO: Move this to config

  web3.eth.getBlock(1, (error, block) => {
    genesisTimestamp = block.timestamp + 262800 // Genesis block timestamp + BSC downtime
  })

  config.networks.BSC.channels.list.forEach(channel => {
    const channelContract = new web3.eth.Contract(config.networks.BSC.channels.abi, channel.address)
    channelContract.events.Input({ fromBlock: nodeCache.bscHeight }, function (error, event) {
      if (error) return
      socketPool.announce('bridging', {
        id: event.returnValues.id.replace('0x', ''),
        network: [ "BSC", "VITE" ],
        hash: [event.transactionHash],
        sender: event.returnValues.from.toLowerCase(),
        recipient: viteJS.wallet.getAddressFromOriginalAddress(event.returnValues.dest.replace('0x', '')),
        tokenId: channel.tokenId,
        amount: event.returnValues.value,
        timestamp: genesisTimestamp + (event.blockNumber * blockTime)
      })

      db.openDB('bridge').putSync(event.returnValues.id.replace('0x', ''), {
        id: event.returnValues.id.replace('0x', ''),
        network: [ "BSC", "VITE" ],
        hash: [event.transactionHash,
          db.openDB('bridge').get(event.returnValues.id.replace('0x', ''))?.hash?.[1]],
        sender: event.returnValues.from.toLowerCase(),
        recipient: viteJS.wallet.getAddressFromOriginalAddress(event.returnValues.dest.replace('0x', '')),
        tokenId: channel.tokenId,
        amount: event.returnValues.value,
        status: db.openDB('bridge').get(event.returnValues.id)?.status ?? false,
        timestamp: genesisTimestamp + (event.blockNumber * blockTime)
      })

      const cache = {
        sender: db.openDB('history').get(event.returnValues.from.toLowerCase()) ?? new Array(),
        recipient: db.openDB('history').get(viteJS.wallet.getAddressFromOriginalAddress(event.returnValues.dest.replace('0x', ''))) ?? new Array()
      }

      cache.sender.push(event.returnValues.id.replace('0x', ''))
      cache.recipient.push(event.returnValues.id.replace('0x', ''))

      db.openDB('history').putSync(event.returnValues.from.toLowerCase(), cache.sender)
      db.openDB('history').putSync(viteJS.wallet.getAddressFromOriginalAddress(event.returnValues.dest.replace('0x', '')), cache.recipient)
    })

    channelContract.events.Output({ fromBlock: nodeCache.bscHeight }, function (error, event) {
      if (error) return

      socketPool.announce('updateBridging', {
        id: event.returnValues.id.replace('0x', ''),
        status: true
      })

      const cache = db.openDB('bridge').get(event.returnValues.id.replace('0x', '')) ?? {}

      cache.status = true

      if (typeof cache.hash === 'object') {
        cache.hash[1] = event.transactionHash
      } else {
        cache.hash = new Array()
        cache.hash[1] = event.transactionHash
      }

      db.openDB('bridge').putSync(event.returnValues.id.replace('0x', ''), cache)
    })

    console.log(`[BSC] Subscribed ${channel.tokenId} successfully!`)
  })
})

process.on('SIGINT', function () {
  console.log('[BRIDGESCAN] Saving block height, please wait...')

  config.networks.VITE.channels.list.forEach(channel => {
    rpcApi.request('ledger_getAccountInfoByAddress', channel.address).then(data => {
      db.openDB('cache').putSync('viteHeight_' + channel.tokenId, (parseInt(data.blockCount) + 1).toString())
      console.log(`[BRIDGESCAN] Vite ${channel.tokenId} channel height ${(parseInt(data.blockCount) + 1).toString()} saved.`)
    })
  })

  web3.eth.getBlockNumber().then((bscHeight) => {
    db.openDB('cache').putSync('bscHeight', bscHeight.toString())
    console.log(`[BRIDGESCAN] BSC height ${bscHeight} saved.`)
  })

  console.log('[BRIDGESCAN] Will exit in next 4 seconds, in case doesnt save everything please delete everything and resync.')

  setTimeout(() => {
    process.exit()
  }, 4000)
})

process.on('unhandledRejection', console.error)

console.log('[BRIDGESCAN] Ready! Starting to connect and sync...')
