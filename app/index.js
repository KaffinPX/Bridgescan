let network = 'TESTNET'
let currentPage = 'txListener'

let knownTxs = {}

const api = new $vite_vitejs.ViteAPI(new $vite_WS.WS_RPC(networkInfo[network].VITE, 6e4, {
  protocol: "",
  headers: "",
  clientConfig: "",
  retryTimes: Infinity,
  retryInterval: 10000})
, async () => {
  channels[network]['VITE'].forEach(bridge => {
    listenViteChannel(bridge.address, bridge.tokenSymbol, bridge.tokenDecimals)
  })

  api._provider.on('connect', () => {
    channels[network]['VITE'].forEach(bridge => {
      if (bridge.network !== 'VITE') return
      listenViteChannel(bridge.address, bridge.tokenSymbol, bridge.tokenDecimals)
    })
  })
})

const web3 = new Web3(networkInfo[network].BSC)
web3.eth.net.isListening().then(() => {
  channels[network]['BSC'].forEach(bridge => {
    listenBSCChannel(bridge.address, bridge.tokenSymbol, bridge.tokenDecimals)
  })
})

window.onload = () => {
  document.getElementById("logo").onclick = () => {
    document.getElementById("loader").classList = "pageloader is-link is-active"
    currentPage = "txListener"
    document.getElementById('bridgingTxs').innerHTML = ""
    document.getElementById("loader").classList = "pageloader is-link"
  }

  document.getElementById('searchAddress').addEventListener('keypress', async function (e) {
    if (e.key === 'Enter') {
      if ($vite_vitejs.wallet.isValidAddress(document.getElementById('searchAddress').value) === 1) {
        document.getElementById('loadingDesc').innerHTML = "Searching, please wait..."
        document.getElementById("loader").classList = "pageloader is-link is-active"

        const accountInfo = await api.request('ledger_getAccountInfoByAddress', document.getElementById('searchAddress').value)

        if (Math.sign(accountInfo.blockCount) === 1) {
          let queryTimes = Math.round(accountInfo.blockCount / 1000) + 1
          let queryBlockCount = Math.round(accountInfo.blockCount / queryTimes)
          
          for (let index = 0; index < queryTimes; index++) {
            const blocks = await api.request('ledger_getAccountBlocksByAddress', document.getElementById('searchAddress').value, index, queryBlockCount)

            blocks.forEach(async block => {
              const isBridging = channels[network]['VITE'].some(el => el.address === block.toAddress)
              if (!isBridging) return

              const answerVm = await api.request('ledger_getVmLogs', block.receiveBlockHash)

              const data = $vite_vitejs.abi.decodeLog(
                contractAbis[network].VITE,
                buffer.Buffer.from(answerVm[0].data, 'base64').toString('hex'),
                answerVm[0].topics.slice(1),
                "Input"
              )

              document.getElementById('bridgingTxs').innerHTML += `<li class="is-clickable" style="font-size: larger;" id="${data.index}" onclick="if (document.getElementById('${data.index}_detailed').style.display === 'none') { document.getElementById('${data.index}_detailed').style.display = 'block' } else {  document.getElementById('${data.index}_detailed').style.display = 'none' }">&#8205;
                <div style="width: 20%; float: left;">${data.from.substring(0, 13)}...</div>
                <div style="width: 20%; float: left;">0x${data.dest.substring(0, 11)}...</div>
                <div style="width: 12%; float: left;">${block.tokenInfo.tokenSymbol}</div>
                <div style="width: 12%; float: left;">${(data.value / parseFloat(`1e${block.tokenInfo.decimals}`)).toFixed(2)}</div>
                <div style="width: 12%; float: left;" id="${data.index}_status">Cannot Fetch</div>
                <div style="width: 12%; float: left;">${(new Date(parseInt(block.timestamp) * 1000)).toLocaleString().slice(0, 16)}</div>
                <div style="width: 12%; float: left;">0 VITE</div>
              </li>
              <div class="box" style="display: none; text-align: left;" id="${data.index}_detailed">
                <h3 class='subtitle is-3'>Transaction</h3>
                <div class="columns">
                  <div class="column">
                    <p><span class="tag is-link">Network</span> Vite > Binance Smart Chain</p>
                    <p><span class="tag is-link">Token</span> ${block.tokenInfo.tokenSymbol}</p>
                    <p><span class="tag is-link">Amount</span> ${(data.value / parseFloat(`1e${block.tokenInfo.decimals}`)).toFixed(2)}</p>
                  </div>
                  <div class="column">
                    <p><span class="tag is-link">From</span> ${data.from.substring(0, 30)}</p>
                    <p><span class="tag is-link">Hash</span> <a href="https://vitcscan.thomiz.dev/tx/${block.hash}" target="_blank">${block.hash.substring(0, 25)}</a></p>
                    <p><span class="tag is-link">Type</span> Lock</p>
                  </div>
                  <div class="column">
                    <p><span class="tag is-link">To</span> 0x${data.dest.substring(0, 30)}</p>
                    <p id="${data.index}_hash"><span class="tag is-link">Hash</span> Waiting contract update</p>
                    <p id="${data.index}_status_detailed"><span class="tag is-link">Status</span> Waiting contract update</p>
                    <p><span class="tag is-link">Type</span> Unlock</p>
                  </div>
                </div>
              </div>
              <div class="margin-20"></div>`
            })
          }
        }

        document.getElementById("searchAddress").value = ""
        currentPage = "accountViewer"
        document.getElementById("loader").classList = "pageloader is-link"
      } else if (web3.utils.isAddress(document.getElementById('searchAddress').value)) {
        let result = []

        channels[network]['BSC'].forEach(async channel => {
          const channelContract = new web3.eth.Contract(contractAbis[network].BSC, channel.address)

          const events = await channelContract.getPastEvents("Input", {
            fromBlock: 0,
            toBlock: 'latest'
          })
          
          events.forEach(event => {
            if (!(event.returnValues.dest === document.getElementById('searchAddress').value || event.returnValues.from === document.getElementById('searchAddress').value)) return
            result.push(event)

            result.sort((a, b) => {
              return b.blockNumber - a.blockNumber
            })
          })
        })

        setInterval(() => {
          result.forEach(tx => {
            // ToDo
          })
        }, 7500)
      } else {
        bulmaToast.toast({
          message: 'Invalid address or not supported.',
          type: 'is-danger',
          position: 'bottom-center',
          dismissible: false,
          duration: 2000,
          animate: { in: 'fadeIn', out: 'fadeOut' }
        })
      }
    }
  })

  document.getElementById('changeNetwork').onclick = () => {
    if (document.getElementById('changeNetwork_name').innerHTML === 'Testnet') {
      document.getElementById('changeNetwork_name').innerHTML = 'Mainnet'
    } else {
      document.getElementById('changeNetwork_name').innerHTML = 'Testnet'
    }

    bulmaToast.toast({
      message: 'Changed network successfuly!',
      type: 'is-link',
      position: 'bottom-center',
      dismissible: false,
      duration: 2000,
      animate: { in: 'fadeIn', out: 'fadeOut' }
    })
  }

  document.getElementById("loader").classList = "pageloader is-link"
}

const listenViteChannel = (contractAddress, tokenName, tokenDecimals) => {
  const signatures = {}; contractAbis[network].VITE.forEach(f => { if (f.type !== 'event') return; signatures[$vite_vitejs.abi.encodeLogSignature(f)] = f })

  api.subscribe('createVmlogSubscription', { addressHeightRange: { [contractAddress]: { fromHeight: '0', toHeight: '0' } } }).then((event) => {
    event.on(async (results) => {
      if (currentPage !== 'txListener') return

      for (const result of results) {
        const f = signatures[result.vmlog.topics[0]]
        if (!f) return

        const decoded = $vite_vitejs.abi.decodeLog(
          f.inputs,
          buffer.Buffer.from(result.vmlog.data, 'base64').toString('hex'),
          result.vmlog.topics.slice(1)
        )

        const data = {}
        for (const input of f.inputs) {
          data[input.name] = decoded[input.name]
        }

        if (f.name === 'Input') {
          const requestBlock = await api.request('ledger_getAccountBlocks', data.from, null, null, 1)

          document.getElementById('bridgingTxs').innerHTML = `<li class="is-clickable" style="font-size: larger;" id="${data.index}" onclick="if (document.getElementById('${data.index}_detailed').style.display === 'none') { document.getElementById('${data.index}_detailed').style.display = 'block' } else {  document.getElementById('${data.index}_detailed').style.display = 'none' }">&#8205;
              <div style="width: 20%; float: left;">${data.from.substring(0, 13)}...</div>
              <div style="width: 20%; float: left;">0x${data.dest.substring(0, 11)}...</div>
              <div style="width: 12%; float: left;">${tokenName}</div>
              <div style="width: 12%; float: left;">${(data.value / parseFloat(`1e${tokenDecimals}`)).toFixed(2)}</div>
              <div style="width: 12%; float: left;" id="${data.index}_status">Pending</div>
              <div style="width: 12%; float: left;">${new Date().toISOString().substr(11, 8)}</div>
              <div style="width: 12%; float: left;">0 VITE</div>
            </li>
            <div class="box" style="display: none; text-align: left;" id="${data.index}_detailed">
              <h3 class='subtitle is-3'>Transaction</h3>
              <div class="columns">
                <div class="column">
                  <p><span class="tag is-link">Token</span> ${tokenName}</p>
                  <p><span class="tag is-link">Amount</span> ${(data.value / parseFloat(`1e${tokenDecimals}`)).toFixed(2)}</p>
                </div>
                <div class="column">
                  <p><span class="tag is-link">From</span> ${data.from.substring(0, 30)}</p>
                  <p><span class="tag is-link">Hash</span> <a href="https://vitcscan.thomiz.dev/tx/${requestBlock[0].hash}" target="_blank">${requestBlock[0].hash.substring(0, 25)}</a></p>
                  <p><span class="tag is-link">Type</span> Unlock</p>
                </div>
                <div class="column">
                  <p><span class="tag is-link">To</span> 0x${data.dest.substring(0, 30)}</p>
                  <p id="${data.index}_hash"><span class="tag is-link">Hash</span> Pending</p>
                  <p><span class="tag is-link">Type</span> Unlock</p>
                </div>
              </div>
            </div>
            <div class="margin-20"></div> ${document.getElementById('bridgingTxs').innerHTML}`
        } else if (f.name === 'Output') {
          if (typeof document.getElementById(data.index + '_status') === 'undefined') return

          const requestBlock = await api.request('ledger_getAccountBlocks', contractAddress, null, null, 1)

          document.getElementById(data.index + '_status').innerHTML = document.getElementById(data.index + '_status').innerHTML.replace('Pending', 'Confirmed')
          document.getElementById(data.index + '_status_detailed').innerHTML = document.getElementById(data.index + '_status_detailed').innerHTML.replace('Pending', 'Confirmed')
          document.getElementById(data.index + '_hash').innerHTML = document.getElementById(data.index + '_hash').innerHTML.replace('Pending', requestBlock[0].hash.substring(0, 25))

          setTimeout(() => {
            document.getElementById(data.index).remove()
            document.getElementById(data.index + '_detailed').remove()
          }, 45 * 1000)
        }
      }
    })
  })
}

const listenBSCChannel = (contractAddress, tokenName, tokenDecimals) => {
  const channelContract = new web3.eth.Contract(contractAbis[network].BSC, contractAddress)

  channelContract.events.Input({}, function (error, event) {
    if (currentPage !== 'txListener') return

    document.getElementById('bridgingTxs').innerHTML = `<li class="is-clickable" style="font-size: larger;" id="${event.returnValues.index}" onclick="if (document.getElementById('${event.returnValues.index}_detailed').style.display === 'none') { document.getElementById('${event.returnValues.index}_detailed').style.display = 'block' } else {  document.getElementById('${event.returnValues.index}_detailed').style.display = 'none' }">&#8205;
      <div style="width: 20%; float: left;">${event.returnValues.from.substring(0, 15)}...</div>
      <div style="width: 20%; float: left;">${event.returnValues.dest.substring(0, 15).replace('0x', 'vite_')}...</div>
      <div style="width: 12%; float: left;">${tokenName}</div>
      <div style="width: 12%; float: left;">${(event.returnValues.value / parseFloat(`1e${tokenDecimals}`)).toFixed(2)}</div>
      <div style="width: 12%; float: left;" id="${event.returnValues.index}_status">Pending</div>
      <div style="width: 12%; float: left;">${new Date().toISOString().substr(11, 8)}</div>
      <div style="width: 12%; float: left;">0 VITE</div>
    </li>
    <div class="box" style="display: none; text-align: left;" id="${event.returnValues.index}_detailed">
      <h3 class='subtitle is-3'>Transaction</h3>
      <div class="columns">
        <div class="column">
          <p><span class="tag is-link">Token</span> ${tokenName}</p>
          <p><span class="tag is-link">Amount</span> ${(event.returnValues.value / parseFloat(`1e${tokenDecimals}`)).toFixed(2)}</p>
        </div>
        <div class="column">
          <p><span class="tag is-link">From</span> ${event.returnValues.from.substring(0, 30)}</p>
          <p><span class="tag is-link">Hash</span> <a href="#" target="_blank">${event.blockHash.substring(0, 25)}</a></p>
          <p><span class="tag is-link">Type</span> Lock</p>
        </div>
        <div class="column">
          <p><span class="tag is-link">To</span> ${event.returnValues.dest.substring(0, 27).replace('0x', 'vite_')}</p>
          <p id="${event.returnValues.index}_hash"><span class="tag is-link">Hash</span> Pending</p>
          <p id="${event.returnValues.index}_status_detailed"><span class="tag is-link">Status</span> Pending</p>
          <p><span class="tag is-link">Type</span> Unlock</p>
        </div>
      </div>
    </div>
    <div class="margin-20"></div> ${document.getElementById('bridgingTxs').innerHTML}`
  })

  channelContract.events.Output({}, function (error, event) {
    if (currentPage !== 'txListener') return

    if (typeof document.getElementById(event.returnValues.index + '_status') === 'undefined') return

    document.getElementById(event.returnValues.index + '_status').innerHTML = document.getElementById(event.returnValues.index + '_status').innerHTML.replace('Pending', 'Confirmed')
    document.getElementById(event.returnValues.index + '_hash').innerHTML = document.getElementById(event.returnValues.index + '_hash').innerHTML.replace('Pending', event.transactionHash.substring(0, 25))

    setTimeout(() => {
      document.getElementById(event.returnValues.index).remove()
      document.getElementById(event.returnValues.index + '_detailed').remove()
    }, 45 * 1000)
  })
}
