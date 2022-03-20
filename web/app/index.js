let environment = {
  network: "testnet",
  currentPage: "subscribe"
}

window.onload = () => {
  const bridgeScan = new WebSocket("ws://localhost:8080")

  bridgeScan.onopen = (event) => {
    document.getElementById("loader").classList = "pageloader is-link"

    bridgeScan.send(JSON.stringify({
      method: "subscribe"
    }))
  }

  bridgeScan.addEventListener("message", function(event) {
    if (!environment.currentPage === "subscribe") return

    const bridging = JSON.parse(event.data)

    if (bridging.method === "bridging") {
      document.getElementById('bridgingTxs').innerHTML += 
      `<li class="is-clickable" style="font-size: larger;" id="${bridging.data.id}">&#8205;
        <div style="width: 20%; float: left;">${bridging.data.sender.substring(0, 13)}...${bridging.data.sender.substring(bridging.data.sender.length - 6)}</div>
        <div style="width: 20%; float: left;">${bridging.data.recipient.substring(0, 13)}...${bridging.data.recipient.substring(bridging.data.recipient.length - 6)}</div>
        <div style="width: 12%; float: left;">${bridging.data.tokenId}</div>
        <div style="width: 12%; float: left;">${parseInt(bridging.data.amount) / 1e18}</div>
        <div id="${bridging.data.id}_status" style="width: 12%; float: left;">${bridging.data.status ? "Success" : "Pending"}</div>
        <div style="width: 12%; float: left;">${(new Date(parseInt(bridging.data.timestamp) * 1000)).toLocaleString('tr-TR').slice(0, 16)}</div>
        <div style="width: 12%; float: left;">0 VITE</div>
      </li>`
    } else if (bridging.method === "bridgingUpdate") { 
      document.getElementById(bridging.data.id + "_status").innerHTML = bridging.data.status ? "Success" : "Pending"
    }
  })

  window.onclick = function (event) {
    if (event.target === document.getElementById('transaction')) {
      document.getElementById('transaction').style.display = 'none'
    }
  }

  document.getElementById('bridgingTxs').addEventListener('click', async function (e) {
    var target = e.target
    while (target && target.parentNode !== document.getElementById('bridgingTxs')) {
      target = target.parentNode
      if (!target) { return }
    }
    if (target.tagName === 'LI') {
      document.getElementById('loading-bar').classList.add("loading-bar-active")

      bridgeScan.send(JSON.stringify({
        method: "getBridging",
        data: [ target.id ]
      }))

      const bridging = await awaitData(bridgeScan, 'getBridging')

      document.getElementById('transaction').style.display = 'block'
      document.getElementById('transactionContent').innerHTML = `
      <h1 class="title">Transaction details</h1>
      <div class="box">
        <p>Token: ${bridging.data.tokenId}</p>
        <p>Amount: ${parseInt(bridging.data.amount) / 1e18}</p>
      </div>
      <div class="box">
        <nav class="level">
          <div class="level-left">
            <div class="level-item">
              <div>
                <img width="75" height="75" style="vertical-align:middle;" src="./app/assets/${bridging.data.network[0]}.png">
                <input type="checkbox" disabled checked>
              </div>
            </div>
            <div class="level-item">
              <div>
                <p>From: <a target="_blank" href="https://${environment.network}.${bridging.data.network[0] === "VITE" ? 'vitcscan.com' : bridging.data.network[0] + 'scan.com'}/address/${bridging.data.sender}">${bridging.data.sender}</a></p>
                <p>From Hash: <a target="_blank" href="https://${environment.network}.${bridging.data.network[0] === "VITE" ? 'vitcscan.com' : bridging.data.network[0] + 'scan.com'}/tx/${bridging.data.hash[0]}">${bridging.data.hash[0]}</a></p>
                <p>Status: Success</p>
                <p>Time: ${(new Date(parseInt(bridging.data.timestamp) * 1000)).toLocaleString('tr-TR').slice(0, 16)}</p>
                <p>Type: Lock</p>
              </div>
            </div>
          </div>
        </nav>
      </div>
      <div class="box">
        <nav class="level">
          <div class="level-left">
            <div class="level-item">
              <div>
              <img width="75" height="75" style="vertical-align:middle;" src="./app/assets/${bridging.data.network[1]}.png">
                <input type="checkbox" disabled ${bridging.data.status ? "checked" : ""}>
              </div>
            </div>
            <div class="level-item">
              <div>
                <p>To: <a target="_blank" href="https://${environment.network}.${bridging.data.network[1] === "VITE" ? 'vitcscan.com' : bridging.data.network[1] + 'scan.com'}/address/${bridging.data.recipient}">${bridging.data.recipient}</a></p>
                <p>To Hash: <a target="_blank" href="https://${environment.network}.${bridging.data.network[1] === "VITE" ? 'vitcscan.com' : bridging.data.network[1] + 'scan.com'}/tx/${bridging.data.hash[1]}">${bridging.data.hash[1]}</a></p></p>
                <p>Status: ${bridging.data.status ? "Success" : "Pending"}</p>
                <p>Time: ${(new Date(parseInt(bridging.data.timestamp) * 1000)).toLocaleString('tr-TR').slice(0, 16)}</p>
                <p>Type: Unlock</p>
              </div>
            </div>
          </div>
        </nav>
      </div>`

      setTimeout(() => {
        document.getElementById('loading-bar').classList.remove("loading-bar-active")
      }, 1000)
    }
  })

  document.getElementById('logo').onclick = function () {
    document.getElementById('loading-bar').classList.add("loading-bar-active")

    document.getElementById('transaction').style.display = 'none'
    document.getElementById('banner_subtitle').innerHTML = `Everything you need to explore Vite decentralised bridge ViteBridge.`
    document.getElementById('bridgingTxs').innerHTML = ""
    environment.currentPage = "subscribe"

    setTimeout(() => {
      document.getElementById('loading-bar').classList.remove("loading-bar-active")
    }, 1000)
  }

  document.getElementById('searchAddress').addEventListener('keypress', async function (e) {
    if (e.key === 'Enter') {
      document.getElementById('loading-bar').classList.add("loading-bar-active")

      bridgeScan.send(JSON.stringify({
        method: "queryAddress",
        data: [ document.getElementById('searchAddress').value ]
      }))

      const data = await awaitData(bridgeScan, 'queryAddress')

      if (typeof data.data === 'undefined') { 
        document.getElementById('loading-bar').classList.remove("loading-bar-active")

        return bulmaToast.toast({
          message: 'Wallet not found.',
          type: 'is-danger',
          position: 'bottom-center',
          dismissible: false,
          duration: 2000,
          animate: { in: 'fadeIn', out: 'fadeOut' }
        })
      }
  
      environment.currentPage = "account"
      let bridgings = []

      for (const bridging of data.data) {
        bridgeScan.send(JSON.stringify({
          method: "getBridging",
          data: [ bridging ]
        }))

        bridgings.push(await awaitData(bridgeScan, 'getBridging'))
      }

      const bridgingsSorted = bridgings.sort((v1, v2) => v2.data.timestamp - v1.data.timestamp)
      
      document.getElementById('banner_subtitle').innerHTML = `Search results for ${document.getElementById('searchAddress').value}`
      document.getElementById('bridgingTxs').innerHTML = ''
      
      bridgingsSorted.forEach(bridging => {
        document.getElementById('bridgingTxs').innerHTML += 
        `<li class="is-clickable" style="font-size: larger;" id="${bridging.data.id}">&#8205;
          <div style="width: 20%; float: left;">${bridging.data.sender.substring(0, 13)}...${bridging.data.sender.substring(bridging.data.sender.length - 6)}</div>
          <div style="width: 20%; float: left;">${bridging.data.recipient.substring(0, 13)}...${bridging.data.recipient.substring(bridging.data.recipient.length - 6)}</div>
          <div style="width: 12%; float: left;">${bridging.data.tokenId}</div>
          <div style="width: 12%; float: left;">${parseInt(bridging.data.amount) / 1e18}</div>
          <div style="width: 12%; float: left;">${bridging.data.status ? "Success" : "Pending"}</div>
          <div style="width: 12%; float: left;">${(new Date(parseInt(bridging.data.timestamp) * 1000)).toLocaleString('tr-TR').slice(0, 16)}</div>
          <div style="width: 12%; float: left;">0 VITE</div>
        </li>`
      })

      document.getElementById('searchAddress').blur()

      setTimeout(() => {
        document.getElementById('loading-bar').classList.remove("loading-bar-active")
      }, 1000)
    }
  })

}

const awaitData = (ws, method) => {
  return new Promise(resolve => {
    ws.addEventListener("message", function(event) {
      const data = JSON.parse(event.data)

      if (data.method === method) resolve(data)
    })
  })
}