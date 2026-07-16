// Service worker — handles queue messages from the PWA via externally_connectable.
// The popup and content script access chrome.storage.local directly.

const QUEUE_KEY = 'rmv_queue'

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  switch (message.type) {

    case 'ADD_TO_QUEUE': {
      chrome.storage.local.get({ [QUEUE_KEY]: [] }, (data) => {
        const updated = [...data[QUEUE_KEY], message.patient]
        chrome.storage.local.set({ [QUEUE_KEY]: updated }, () => {
          sendResponse({ ok: true, queueLength: updated.length })
        })
      })
      return true // keep channel open for async response
    }

    case 'ADD_TO_QUEUE_FRONT': {
      chrome.storage.local.get({ [QUEUE_KEY]: [] }, (data) => {
        const updated = [message.patient, ...data[QUEUE_KEY]]
        chrome.storage.local.set({ [QUEUE_KEY]: updated }, () => {
          sendResponse({ ok: true, queueLength: updated.length })
        })
      })
      return true
    }

    case 'GET_QUEUE': {
      chrome.storage.local.get({ [QUEUE_KEY]: [] }, (data) => {
        sendResponse({ queue: data[QUEUE_KEY] })
      })
      return true
    }

    case 'CLEAR_QUEUE': {
      chrome.storage.local.set({ [QUEUE_KEY]: [] }, () => {
        sendResponse({ ok: true })
      })
      return true
    }

    case 'ADD_BATCH_TO_QUEUE': {
      chrome.storage.local.get({ [QUEUE_KEY]: [] }, (data) => {
        const updated = [...data[QUEUE_KEY], ...(message.patients || [])]
        chrome.storage.local.set({ [QUEUE_KEY]: updated }, () => {
          sendResponse({ ok: true, queueLength: updated.length })
        })
      })
      return true
    }
  }
})
