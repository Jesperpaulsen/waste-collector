import { NetworkCall } from '../../types/src/network-call'

enum MESSAGE_TYPES {
  ARRAY_BUFFER = 'arraybuffer',
  BLOB = 'blob',
  JSON = 'json',
  TEXT = 'text'
}

const dataTypeToSizeMap: { [key in MESSAGE_TYPES]: (data: any) => number } = {
  [MESSAGE_TYPES.ARRAY_BUFFER]: (data) => (data as ArrayBuffer).byteLength,
  [MESSAGE_TYPES.BLOB]: (data) => (data as Blob).size,
  [MESSAGE_TYPES.JSON]: (data) =>
    new TextEncoder().encode(JSON.stringify(data)).length,
  [MESSAGE_TYPES.TEXT]: (data) => new Blob([data]).size
}

const calculateBodySize = (body: any, type: MESSAGE_TYPES) => {
  const methodUsedToCalculateSize = dataTypeToSizeMap[type]
  if (!methodUsedToCalculateSize) return null
  return methodUsedToCalculateSize(body)
}

let messagesToSend: NetworkCall[] = []

const sendMessages = () => {
  const messages = [...messagesToSend]
  console.log(messages)
  messagesToSend = []
  for (const message of messages) {
    try {
      chrome.runtime.sendMessage({ type: 'networkCall', networkCall: message })
    } catch (e) {
      console.log(e)
      messagesToSend.push(message)
    }
  }
}

const sendMessage = (networkCall: NetworkCall) => {
  messagesToSend.push(networkCall)
  sendMessages()
}

const handleIncommingMessage = ({
  type,
  url,
  headers,
  timestamp,
  data,
  host
}: {
  type: NetworkCall['type']
  url: string
  headers: string
  timestamp: number
  data: any
  host: NetworkCall['host']
}) => {
  const bodySize = calculateBodySize(data, type as MESSAGE_TYPES) || 0
  const headerSize = calculateBodySize(headers, MESSAGE_TYPES.TEXT) || 0
  const size = bodySize + headerSize
  const networkCall: NetworkCall = {
    type,
    size,
    url,
    headers,
    timestamp,
    host,
    manuallyCalculated: true
  }
  sendMessage(networkCall)
}

window.addEventListener(
  'message',
  (event: MessageEvent<{ type: string; networkCall: NetworkCall }>) => {
    if (event.source !== window || !event.data?.networkCall) {
      return
    }
    if (event.data?.type === 'networkCall') {
      const networkCall = event.data.networkCall
      handleIncommingMessage({
        type: networkCall.type,
        url: networkCall.url,
        headers: networkCall.headers,
        data: networkCall.data,
        timestamp: networkCall.timestamp,
        host: networkCall.host
      })
    }
  },
  false
)

const scriptsToLoad = ['injected-xhr.js', 'injected-fetch.js']
for (const path of scriptsToLoad) {
  const script = document.createElement('script')
  script.src = chrome.runtime.getURL(path)
  script.onload = function () {
    // @ts-ignore
    // this.remove()
  }
  ;(document.head || document.documentElement).appendChild(script)
}
