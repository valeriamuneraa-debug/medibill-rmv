'use strict'

const QUEUE_KEY = 'rmv_queue'

// ── DOM refs ──────────────────────────────────────────────────────────────

const elCount     = document.getElementById('queue-count')
const elList      = document.getElementById('patient-list')
const elEmpty     = document.getElementById('empty-state')
const elQueueWrap = document.getElementById('queue-section')
const elFooter    = document.getElementById('footer')
const btnGo       = document.getElementById('btn-go')
const btnClear    = document.getElementById('btn-clear')
const elConfirm   = document.getElementById('confirm-clear')
const btnConfirmYes = document.getElementById('btn-confirm-yes')
const btnConfirmNo  = document.getElementById('btn-confirm-no')

// ── Render ────────────────────────────────────────────────────────────────

function render(queue) {
  const n = queue.length

  if (n === 0) {
    elQueueWrap.style.display = 'none'
    elEmpty.style.display     = 'flex'
    elFooter.style.display    = 'none'
  } else {
    elQueueWrap.style.display = 'block'
    elEmpty.style.display     = 'none'
    elFooter.style.display    = 'flex'

    elCount.textContent = `${n} paciente${n !== 1 ? 's' : ''} en cola`

    elList.innerHTML = ''
    queue.forEach((p, i) => {
      const li = document.createElement('li')
      li.style.cssText = [
        'display:flex',
        'align-items:center',
        'justify-content:space-between',
        'padding:10px 14px',
        'border-bottom:1px solid rgba(255,255,255,0.08)',
        'gap:8px',
      ].join(';')

      const name = document.createElement('span')
      name.textContent = p.nombre || 'Paciente sin nombre'
      name.style.cssText = 'font-size:14px;font-weight:500;color:#ffffff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1'
      li.appendChild(name)

      if (i === 0) {
        const badge = document.createElement('span')
        badge.textContent = 'Siguiente'
        badge.style.cssText = [
          'font-size:11px',
          'font-weight:600',
          'color:rgba(255,255,255,0.5)',
          'letter-spacing:0.06em',
          'text-transform:uppercase',
          'white-space:nowrap',
          'flex-shrink:0',
        ].join(';')
        li.appendChild(badge)
      }

      const removeBtn = document.createElement('button')
      removeBtn.textContent = '✕'
      removeBtn.setAttribute('aria-label', `Quitar a ${p.nombre || 'paciente'} de la cola`)
      removeBtn.style.cssText = [
        'background:none',
        'border:none',
        'color:rgba(255,255,255,0.3)',
        'cursor:pointer',
        'font-size:13px',
        'padding:4px 6px',
        'flex-shrink:0',
        'font-family:inherit',
        'transition:color 120ms ease',
        'line-height:1',
        'border-radius:4px',
      ].join(';')
      removeBtn.addEventListener('mouseenter', () => { removeBtn.style.color = 'rgba(255,255,255,0.75)' })
      removeBtn.addEventListener('mouseleave', () => { removeBtn.style.color = 'rgba(255,255,255,0.3)' })
      removeBtn.addEventListener('click', () => removeByIndex(i))
      li.appendChild(removeBtn)

      elList.appendChild(li)
    })
  }

  // Reset confirmation state whenever we re-render
  hideConfirm()
}

// ── Remove single patient ─────────────────────────────────────────────────

function removeByIndex(i) {
  chrome.storage.local.get({ [QUEUE_KEY]: [] }, data => {
    const updated = (data[QUEUE_KEY] || []).filter((_, idx) => idx !== i)
    chrome.storage.local.set({ [QUEUE_KEY]: updated }, load)
  })
}

// ── Load ──────────────────────────────────────────────────────────────────

function load() {
  chrome.storage.local.get({ [QUEUE_KEY]: [] }, data => {
    render(data[QUEUE_KEY] || [])
  })
}

// ── Confirm clear UI ──────────────────────────────────────────────────────

function showConfirm() {
  btnClear.style.display   = 'none'
  elConfirm.style.display  = 'flex'
}

function hideConfirm() {
  btnClear.style.display   = 'block'
  elConfirm.style.display  = 'none'
}

// ── Events ────────────────────────────────────────────────────────────────

btnGo.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://facturador.emision.co/clients/form' })
  window.close()
})

btnClear.addEventListener('click', showConfirm)
btnConfirmNo.addEventListener('click', hideConfirm)

btnConfirmYes.addEventListener('click', () => {
  chrome.storage.local.set({ [QUEUE_KEY]: [] }, load)
})

// Live-update popup when queue changes from content script or background.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[QUEUE_KEY]) {
    render(changes[QUEUE_KEY].newValue || [])
  }
})

// ── Init ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', load)
