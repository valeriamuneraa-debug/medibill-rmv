;(function () {
  'use strict'

  const QUEUE_KEY = 'rmv_queue'

  // ── Colombian cities → departamento ──────────────────────────────────────
  // Keys are normalized (lowercase, no accents) for matching against patient.direccion.
  const CITIES = {
    'medellin':         { ciudad: 'Medellín',                  dpto: 'Antioquia' },
    'envigado':         { ciudad: 'Envigado',                  dpto: 'Antioquia' },
    'bello':            { ciudad: 'Bello',                     dpto: 'Antioquia' },
    'itagui':           { ciudad: 'Itagüí',                    dpto: 'Antioquia' },
    'sabaneta':         { ciudad: 'Sabaneta',                  dpto: 'Antioquia' },
    'la estrella':      { ciudad: 'La Estrella',               dpto: 'Antioquia' },
    'caldas':           { ciudad: 'Caldas',                    dpto: 'Antioquia' },
    'copacabana':       { ciudad: 'Copacabana',                dpto: 'Antioquia' },
    'rionegro':         { ciudad: 'Rionegro',                  dpto: 'Antioquia' },
    'el retiro':        { ciudad: 'El Retiro',                 dpto: 'Antioquia' },
    'marinilla':        { ciudad: 'Marinilla',                 dpto: 'Antioquia' },
    'guarne':           { ciudad: 'Guarne',                    dpto: 'Antioquia' },
    'turbo':            { ciudad: 'Turbo',                     dpto: 'Antioquia' },
    'bogota':           { ciudad: 'Bogotá',                    dpto: 'Cundinamarca' },
    'soacha':           { ciudad: 'Soacha',                    dpto: 'Cundinamarca' },
    'cali':             { ciudad: 'Cali',                      dpto: 'Valle del Cauca' },
    'buenaventura':     { ciudad: 'Buenaventura',              dpto: 'Valle del Cauca' },
    'palmira':          { ciudad: 'Palmira',                   dpto: 'Valle del Cauca' },
    'buga':             { ciudad: 'Buga',                      dpto: 'Valle del Cauca' },
    'barranquilla':     { ciudad: 'Barranquilla',              dpto: 'Atlántico' },
    'soledad':          { ciudad: 'Soledad',                   dpto: 'Atlántico' },
    'cartagena':        { ciudad: 'Cartagena',                 dpto: 'Bolívar' },
    'bucaramanga':      { ciudad: 'Bucaramanga',               dpto: 'Santander' },
    'barrancabermeja':  { ciudad: 'Barrancabermeja',           dpto: 'Santander' },
    'pereira':          { ciudad: 'Pereira',                   dpto: 'Risaralda' },
    'manizales':        { ciudad: 'Manizales',                 dpto: 'Caldas' },
    'santa marta':      { ciudad: 'Santa Marta',               dpto: 'Magdalena' },
    'ibague':           { ciudad: 'Ibagué',                    dpto: 'Tolima' },
    'villavicencio':    { ciudad: 'Villavicencio',             dpto: 'Meta' },
    'monteria':         { ciudad: 'Montería',                  dpto: 'Córdoba' },
    'pasto':            { ciudad: 'Pasto',                     dpto: 'Nariño' },
    'neiva':            { ciudad: 'Neiva',                     dpto: 'Huila' },
    'armenia':          { ciudad: 'Armenia',                   dpto: 'Quindío' },
    'popayan':          { ciudad: 'Popayán',                   dpto: 'Cauca' },
    'valledupar':       { ciudad: 'Valledupar',                dpto: 'Cesar' },
    'sincelejo':        { ciudad: 'Sincelejo',                 dpto: 'Sucre' },
    'tunja':            { ciudad: 'Tunja',                     dpto: 'Boyacá' },
    'puerto boyaca':    { ciudad: 'Puerto Boyacá',             dpto: 'Boyacá' },
    'florencia':        { ciudad: 'Florencia',                 dpto: 'Caquetá' },
    'quibdo':           { ciudad: 'Quibdó',                    dpto: 'Chocó' },
    'riohacha':         { ciudad: 'Riohacha',                  dpto: 'La Guajira' },
    'san andres':       { ciudad: 'San Andrés',                dpto: 'Archipiélago de San Andrés' },
    'mocoa':            { ciudad: 'Mocoa',                     dpto: 'Putumayo' },
    'puerto leguizamo': { ciudad: 'Puerto Leguízamo',          dpto: 'Putumayo' },
    'leticia':          { ciudad: 'Leticia',                   dpto: 'Amazonas' },
    'puerto carreno':   { ciudad: 'Puerto Carreño',            dpto: 'Vichada' },
    'inirida':          { ciudad: 'Inírida',                   dpto: 'Guainía' },
    'mitu':             { ciudad: 'Mitú',                      dpto: 'Vaupés' },
    'yopal':            { ciudad: 'Yopal',                     dpto: 'Casanare' },
    'arauca':           { ciudad: 'Arauca',                    dpto: 'Arauca' },
    'cucuta':           { ciudad: 'Cúcuta',                    dpto: 'Norte de Santander' },
    'cucuta':           { ciudad: 'Cúcuta',                    dpto: 'Norte de Santander' },
  }

  // ── Form field selectors ──────────────────────────────────────────────────
  // Verify these against the actual facturador.emision.co DOM in DevTools.
  // Open the Agregar Cliente form → right-click any field → Inspect.
  const SEL = {
    nombre:     'input[name="name"], input[name="razon_social"], input[id*="name"]',
    tipoDoc:    'select[name="document_type"], select[name="tipo_documento"], select[id*="document_type"]',
    numDoc:     'input[name="document_number"], input[name="document"], input[name="numero_documento"]',
    tipoOrg:    'select[name="organization_type"], select[name="tipo_organizacion"]',
    regimen:    'select[name="tax_regime"], select[name="regimen_fiscal"], select[name="regime"]',
    respFiscal: 'select[name="fiscal_responsibility"], select[name="responsabilidad_fiscal"]',
    detTrib:    'select[name="tax_detail"], select[name="detalles_tributarios"]',
    pais:       'select[name="country"], select[name="pais"]',
    dpto:       'select[name="state"], select[name="departamento"], select[name="province"]',
    ciudad:     'select[name="city"], select[name="ciudad"], select[name="municipality"]',
    direccion:  'input[name="address"], input[name="direccion"]',
    genero:     'select[name="gender"], select[name="genero"]',
    telefono:   'input[name="phone"], input[name="telefono"], input[type="tel"]',
    email:      'input[name="email"], input[type="email"]',
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  function norm(str) {
    return (str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
  }

  // Resolve first matching selector for multi-selector strings.
  function queryFirst(multiSel) {
    for (const sel of multiSel.split(',').map(s => s.trim())) {
      try {
        const el = document.querySelector(sel)
        if (el) return el
      } catch (_) { /* invalid selector, skip */ }
    }
    return null
  }

  // Fill a React-controlled <input> or <textarea>.
  function fillInput(multiSel, value) {
    const el = queryFirst(multiSel)
    if (!el) return false
    const proto = el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set
    setter.call(el, String(value))
    el.dispatchEvent(new Event('input',  { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  }

  // Fill a React-controlled <select>.
  function fillSelect(multiSel, value) {
    const el = queryFirst(multiSel)
    if (!el) return false
    // Try exact match first, then case-insensitive partial match.
    const options = Array.from(el.options)
    const target  = norm(value)
    const match   = options.find(o => norm(o.text) === target || norm(o.value) === target)
                 || options.find(o => norm(o.text).includes(target) || target.includes(norm(o.text)))
    if (!match) return false
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
    setter.call(el, match.value)
    el.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  }

  function getCityAndDept(direccion) {
    const DEFAULT = { ciudad: 'Medellín', dpto: 'Antioquia' }
    if (!direccion) return DEFAULT

    const tokens = norm(direccion).split(/[\s,#.-]+/).filter(Boolean)

    // Try 2-word combos first (e.g. "santa marta"), then 1-word.
    for (let len = 2; len >= 1; len--) {
      for (let i = 0; i <= tokens.length - len; i++) {
        const candidate = tokens.slice(i, i + len).join(' ')
        if (CITIES[candidate]) return CITIES[candidate]
      }
    }
    return DEFAULT
  }

  // ── Floating button ───────────────────────────────────────────────────────

  let btn = null
  let queue = []

  function injectFont() {
    if (document.getElementById('rmv-font')) return
    const link = document.createElement('link')
    link.id   = 'rmv-font'
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@500;600&display=swap'
    document.head.appendChild(link)
  }

  function createBtn() {
    const el = document.createElement('button')
    el.id    = 'rmv-autofill-btn'
    Object.assign(el.style, {
      position:       'fixed',
      bottom:         '24px',
      right:          '24px',
      zIndex:         '2147483647',
      fontFamily:     "'Outfit', system-ui, -apple-system, sans-serif",
      fontSize:       '14px',
      fontWeight:     '600',
      color:          '#ffffff',
      background:     '#172137',
      border:         '1.5px solid rgba(255,255,255,0.2)',
      borderRadius:   '12px',
      padding:        '12px 20px',
      minHeight:      '48px',
      cursor:         'pointer',
      boxShadow:      '0 4px 24px rgba(0,0,0,0.32), 0 1px 6px rgba(0,0,0,0.18)',
      whiteSpace:     'nowrap',
      letterSpacing:  '0.02em',
      lineHeight:     '1.4',
      transition:     'transform 150ms ease, box-shadow 150ms ease, background 200ms ease',
      display:        'none',
      userSelect:     'none',
      WebkitFontSmoothing: 'antialiased',
    })
    el.addEventListener('mouseenter', () => {
      if (!el.disabled) {
        el.style.transform = 'scale(1.02)'
        el.style.boxShadow = '0 6px 32px rgba(0,0,0,0.38), 0 2px 8px rgba(0,0,0,0.2)'
      }
    })
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)'
      el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.32), 0 1px 6px rgba(0,0,0,0.18)'
    })
    el.addEventListener('mousedown', () => { if (!el.disabled) el.style.transform = 'scale(0.97)' })
    el.addEventListener('mouseup',   () => { el.style.transform = 'scale(1)' })
    document.body.appendChild(el)
    return el
  }

  function setBtn(opts) {
    if (!btn) return
    const { text, bg, disabled, visible } = opts
    btn.textContent       = text
    btn.disabled          = !!disabled
    btn.style.background  = bg || '#172137'
    btn.style.cursor      = disabled ? 'default' : 'pointer'
    btn.style.opacity     = disabled ? '0.75' : '1'
    btn.style.display     = visible === false ? 'none' : 'block'
  }

  // ── Queue operations ──────────────────────────────────────────────────────

  function loadQueue() {
    return new Promise(resolve => {
      chrome.storage.local.get({ [QUEUE_KEY]: [] }, data => {
        resolve(data[QUEUE_KEY] || [])
      })
    })
  }

  function removeFirst() {
    return new Promise(resolve => {
      chrome.storage.local.get({ [QUEUE_KEY]: [] }, data => {
        const updated = (data[QUEUE_KEY] || []).slice(1)
        chrome.storage.local.set({ [QUEUE_KEY]: updated }, () => resolve(updated))
      })
    })
  }

  // ── Form fill ─────────────────────────────────────────────────────────────

  async function fillForm(patient) {
    const { ciudad, dpto } = getCityAndDept(patient.direccion)

    fillInput(SEL.nombre,     patient.nombre    || '')
    fillSelect(SEL.tipoDoc,   patient.tipoDoc   || 'Cédula de ciudadanía')
    fillInput(SEL.numDoc,     patient.id        || '')
    fillSelect(SEL.tipoOrg,   'Persona Natural')
    fillSelect(SEL.regimen,   'No responsable de IVA')
    fillSelect(SEL.respFiscal,'R-99-PN – No aplica – Otros*')
    fillSelect(SEL.detTrib,   'ZZ – No aplica')
    fillSelect(SEL.pais,      'Colombia')
    fillSelect(SEL.dpto,      dpto)

    // Ciudad dropdown is dependent — wait for it to repopulate after departamento change.
    await wait(500)

    fillSelect(SEL.ciudad,    ciudad)
    fillInput(SEL.direccion,  patient.direccion || '')
    fillSelect(SEL.genero,    patient.genero    || 'Femenino')
    fillInput(SEL.telefono,   patient.telefono  || '')
    fillInput(SEL.email,      patient.email     || '')
  }

  // ── Success detection ─────────────────────────────────────────────────────

  let formFilled  = false
  let savedHook   = null // cleanup fn

  async function onFormSaved() {
    if (savedHook) { savedHook(); savedHook = null }
    formFilled = false
    queue = await removeFirst()

    if (queue.length > 0) {
      const n = queue.length
      setBtn({
        text:    `Siguiente paciente ▶ (${n} restante${n !== 1 ? 's' : ''})`,
        bg:      '#172137',
        visible: true,
      })
    } else {
      setBtn({ text: '✓ Todos los pacientes registrados', bg: '#172137', disabled: true, visible: true })
      setTimeout(() => setBtn({ visible: false }), 4000)
    }
  }

  function watchForSave() {
    // Intercept history.pushState (SPA navigation after save redirects away from form).
    const origPush = history.pushState.bind(history)
    history.pushState = function (...args) {
      origPush(...args)
      setTimeout(() => {
        if (formFilled && !isFormPage()) onFormSaved()
      }, 200)
    }

    // Also watch for success text appearing in the DOM (toast / alert).
    const observer = new MutationObserver(() => {
      if (!formFilled) return
      const body = document.body.innerText.toLowerCase()
      if (body.includes('exitosamente') || body.includes('creado') || body.includes('guardado')) {
        observer.disconnect()
        onFormSaved()
      }
    })
    observer.observe(document.body, { subtree: true, childList: true, characterData: true })

    savedHook = () => {
      observer.disconnect()
      history.pushState = origPush
    }
  }

  // ── URL detection ─────────────────────────────────────────────────────────

  function isFormPage() {
    const p = window.location.pathname + window.location.hash
    return (
      p.includes('/clients/form')  ||
      p.includes('/clients/new')   ||
      p.includes('/clientes/form') ||
      p.includes('/clientes/new')  ||
      p.includes('/client/form')   ||
      p.includes('/client/new')
    )
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  async function init() {
    if (!isFormPage()) return

    injectFont()
    if (!btn) btn = createBtn()

    queue = await loadQueue()
    if (queue.length === 0) {
      setBtn({ visible: false })
      return
    }

    setBtn({ text: 'Cargar paciente ▶', bg: '#172137', visible: true })

    btn.onclick = async () => {
      if (!queue.length) return
      setBtn({ text: 'Cargando...', disabled: true, visible: true })

      await fillForm(queue[0])

      formFilled = true
      setBtn({
        text:    '✓ Formulario listo — revisa y guarda',
        bg:      '#15803d',
        visible: true,
      })
      watchForSave()
    }
  }

  // ── SPA navigation handling ───────────────────────────────────────────────
  // Re-run init when the page navigates within the SPA (after init already ran once).

  const _origPush = history.pushState.bind(history)
  history.pushState = function (...args) {
    _origPush(...args)
    setTimeout(init, 300)
  }
  window.addEventListener('popstate', () => setTimeout(init, 300))

  // Initial run
  init()

})()
