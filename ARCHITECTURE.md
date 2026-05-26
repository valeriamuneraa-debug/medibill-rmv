# MediBill RMV — System Architecture

```mermaid
flowchart TD
    subgraph INPUT["📥 Entrada"]
        A[Historia clínica impresa]
        B[Pacientes_2026.xlsx — plantilla]
    end

    subgraph PWA["🌐 PWA — medibill-rmv.vercel.app"]
        C[Setup\nCarga plantilla .xlsx]
        D[DatePicker\nSelección de fecha de cirugía]
        E[Camera\nFotografiar / subir imagen / PDF]
        F[/api/extract\nVercel Serverless Function]
        G[Review\n6 campos + indicadores de confianza]
        H[ClinicalData\nProcedimiento · Presupuesto · Factura Dian]
        I[Success]
        J[Registry\nBúsqueda + multi-selección]
        K[PatientEdit\nEdición de datos clínicos]
    end

    subgraph ANTHROPIC["🤖 Anthropic API"]
        L[claude-sonnet-4-6\nExtracción visual estructurada]
    end

    subgraph STORAGE["💾 IndexedDB — Dispositivo local"]
        M[(Workbook acumulado\nPacientes_2026)]
        N[(Cola de emisión\nPacientes pendientes)]
    end

    subgraph EXTENSION["🔌 Chrome Extension — Sideloaded"]
        O[Popup\nGestión de cola]
        P[Content Script\nRellena formulario con IDs confirmados]
    end

    subgraph EMISION["🏛️ facturador.emision.co"]
        Q[Formulario Agregar Cliente\nclient_name · client_document_number\nclient_organization_type · dropdowns]
    end

    subgraph OUTPUT["📤 Salida"]
        R[Pacientes_2026_fecha.xlsx\nHoja 1 + Resumen con SUMPRODUCT]
        S[Cliente registrado en e-Misión\nSin escritura manual]
    end

    A --> E
    B --> C
    C --> M
    D --> E
    E -->|"base64 comprimida ~200KB"| F
    F -->|"imagen + prompt estructurado en español"| L
    L -->|"JSON + confidence scores"| F
    F -->|"datos extraídos"| G
    G -->|"datos verificados"| H
    H -->|"fila completa"| M
    H --> I
    I -->|"Enviar a emisión"| N
    I --> J
    J --> K
    J -->|"Selección múltiple"| N
    K --> M
    M -->|"SheetJS export"| R
    N --> O
    N --> P
    P -->|"fillField + fillSelect\ncon 1500ms delay para cascada"| Q
    Q --> S
```

## Component descriptions

### PWA — Progressive Web App
Deployed on Vercel. Mobile-first React + Vite + Tailwind.
Runs on Dr. Múnera's iPhone 17 Pro Max, iPad, and MacBook.
Installable via "Add to Home Screen" with the RMV monogram icon.

**Screens in order:**
- **Setup** — one-time upload of Pacientes_2026.xlsx template
- **DatePicker** — mandatory surgery date selection per session
- **Camera** — two paths: photograph live or select from library/files (accepts images and PDFs)
- **/api/extract** — Vercel serverless function (Node.js runtime), proxies to Anthropic API, never stores data
- **Review** — editable form with 6 extracted fields, low-confidence fields flagged amber
- **ClinicalData** — optional clinical fields (Procedimiento, Presupuesto, Clínica, etc.)
- **Success** — confirmation with options to add another, send to emisión, or export
- **Registry** — full patient list with search, multi-select, bulk actions
- **PatientEdit** — edit any patient's clinical data

### Vercel Serverless Function — /api/extract
- Accepts POST with `{ image: base64string, mediaType: string }`
- Compresses images client-side before sending (~200KB vs ~10MB raw)
- Calls Anthropic claude-sonnet-4-6 with Spanish-language extraction prompt
- Returns `{ nombre, id, edad, telefono, direccion, email, confidence: {...} }`
- API key stored as Vercel environment variable — never in client code or repo
- Zero server-side storage of patient data or images

### IndexedDB — Local Storage
- `workbook` key: full SheetJS workbook object (Hoja 1 + Resumen)
- `emisión-queue` key: array of patient objects pending form submission
- Persists between sessions on the same device/browser
- Cross-device: export from phone → re-import on desktop via "Reestablecer plantilla"

### SheetJS Export
- Reads existing Pacientes_2026.xlsx structure exactly
- Appends new rows after last real patient (skips "Nombre" placeholder rows)
- Preserves all column widths, fonts, and formatting
- Generates Resumen sheet with SUMPRODUCT formulas per month
- Removes phantom "Hoja 2" if present

### Chrome Extension — Sideloaded
- Manifest V3, developer mode sideloading (no Chrome Web Store)
- `content.js`: runs on facturador.emision.co, fills form using confirmed field IDs
- `popup.js`: queue management UI — view pending, remove individual, clear all
- `background.js`: handles messages from PWA via externally_connectable
- Uses 1,500ms delay after department_id change for city dropdown cascade
- Stops before Guardar — Dr. Múnera visually confirms each entry

### facturador.emision.co
Colombian government-authorized electronic invoicing platform.
The extension fills: client_name, client_document_number,
identification_type_id, client_organization_type, client_regime_type,
tax_responsibility_id, client_tax_detail_id, department_id,
municipality_id, client_gender, client_phone, client_email,
client_address_1.

Four dropdowns are always the same (Persona Natural /
No responsable de IVA / R-99-PN / ZZ – No aplica) and
are filled automatically.
