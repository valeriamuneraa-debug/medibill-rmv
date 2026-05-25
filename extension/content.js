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

  // ── Helpers ───────────────────────────────────────────────────────────────

  const sleep = ms => new Promise(r => setTimeout(r, ms))

  function fillField(id, value) {
    const el = document.getElementById(id)
    if (!el) { console.warn('MediBill: not found:', id); return false }
    el.value = String(value)
    el.dispatchEvent(new Event('change', { bubbles: true }))
    el.dispatchEvent(new Event('input',  { bubbles: true }))
    console.log('MediBill filled', id, '=', String(value))
    return true
  }

  function selectByText(id, text) {
    const el = document.getElementById(id)
    if (!el) { console.warn('MediBill: select not found:', id); return false }
    const options = Array.from(el.options)
    const match = options.find(o =>
      o.text.trim().toLowerCase().includes(text.toLowerCase()) ||
      text.toLowerCase().includes(o.text.trim().toLowerCase())
    )
    if (!match) {
      console.warn('MediBill: no match for', text, 'options:', options.map(o => o.text))
      return false
    }
    el.value = match.value
    el.dispatchEvent(new Event('change', { bubbles: true }))
    console.log('MediBill select', id, '=', match.text)
    return true
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

  // ── City → departamento lookup ────────────────────────────────────────────

  function getCityDept(direccion) {
    if (!direccion) return { ciudad: 'Medellín', departamento: 'Antioquia' }
    const norm = direccion.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
    for (const [key, val] of Object.entries(CITIES)) {
      if (norm.includes(key)) return { ciudad: val.ciudad, departamento: val.dpto }
    }
    return { ciudad: 'Medellín', departamento: 'Antioquia' }
  }

  // ── Form fill ─────────────────────────────────────────────────────────────

  async function fillForm(patient) {
    await sleep(800)

    fillField('client_name', patient.nombre || '')
    await sleep(200)

    selectByText('identification_type_id', patient.tipoDoc || 'Cédula de ciudadanía')
    await sleep(200)

    fillField('client_document_number', patient.id || '')
    await sleep(200)

    selectByText('client_organization_type', 'Persona Natural')
    await sleep(200)

    selectByText('client_regime_type', 'No responsable de IVA')
    await sleep(200)

    selectByText('tax_responsibility_id', 'R-99-PN')
    await sleep(200)

    selectByText('client_tax_detail_id', 'ZZ')
    await sleep(200)

    const dept = getCityDept(patient.direccion)
    selectByText('department_id', dept.departamento)
    await sleep(1500)

    selectByText('municipality_id', dept.ciudad)
    await sleep(200)

    fillField('client_address_1', patient.direccion || '')
    await sleep(200)

    selectByText('client_gender', patient.genero || 'Femenino')
    await sleep(200)

    fillField('client_phone', patient.telefono || '')
    await sleep(200)

    fillField('client_email', patient.email || '')

    console.log('MediBill: form fill complete')
    return true
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
