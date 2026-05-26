# MediBill RMV
### AI 201 Project 3 — Valeria Múnera | Spring 2026

**Live URL:** https://medibill-rmv.vercel.app
**Chrome Extension:** `/extension` folder — sideload in developer mode

> A Progressive Web App + Chrome Extension that lets Dr. RM,
> an independent plastic surgeon in Colombia, photograph a patient's printed
> clinic history, extract billing data via AI vision, review and approve it,
> and have it automatically entered into the Colombian government's invoicing
> platform — eliminating the manual re-keying that previously consumed
> 45–60 minutes per month.

---

## Design Argument

**The person:** Dr. RM is a plastic surgeon practicing
independently in Medellín, Colombia. He is my father and someone I speak
with every day. He operates approximately 15 new patients per month,
primarily at IQ InterQuirófanos in El Poblado.

**The problem:**

[WRITE THIS IN YOUR OWN WORDS — use the Research Compilation document
as scaffolding. The brief says this must be specific: not "he has trouble
with billing" but the exact friction, the exact moment it breaks down,
the exact consequence. Example template: "Every time Dr. M treats a
new patient, he must register them in Colombia's mandatory invoicing
platform by re-entering 8+ fields of data that already exist on a paper
form in his hands. He currently relies on his daughter to do this as
a manual copy-paste task — meaning he cannot complete his own legally
required billing independently. At 15 new patients per month, this is
45-60 minutes of pure administrative friction that does not touch
medicine."]

**What "helped" looks like:**

[WRITE THIS IN YOUR OWN WORDS — measurable, observable, for him
specifically. Not aspirational. Example angles: time saved per patient,
number of typed characters eliminated, whether he can complete the process
independently without his daughter, whether the monthly social security
number is available without manual calculation.]

**Why I am the right person to build this:**

[WRITE THIS IN YOUR OWN WORDS — your relationship, your first-person
knowledge of the workflow, your language, your access, your design skills.
One confident paragraph.]

---

## Research Documentation

**Interview method:** Direct observation and daily conversation with my
father across multiple sessions. I have personal first-hand knowledge of
this workflow — I am currently the person who performs the manual
copy-paste step he needs to eliminate.

**Evidence gathered:**

| Evidence | What it shows |
|---|---|
| Pacientes_2026.xlsx (real file, de-identified) | His ledger structure — 17 columns, ~1010 pre-formatted rows, single continuous sheet "Hoja 1", no formulas, handcoded values throughout |
| 6 emisión screenshots (annotated) | The exact Agregar Cliente form I fill out, field by field, with default dropdown values and form field IDs confirmed via DOM inspection |
| DOM diagnostic output | console.querySelectorAll output showing exact HTML field IDs (client_name, client_document_number, client_organization_type, etc.) used to build the Chrome extension |
| His logo files (logo.ai, logo2.pdf) | Brand identity — navy #172137, white, uppercase geometric typography |
| His Instagram | Public professional identity and brand context |

**Direct observations from my father during supervised development:**

[WRITE THESE IN YOUR OWN WORDS — his actual words, your observations
of him using the tool. Include: what he said when he first saw his patient
data appear in the Registry, his reaction to the extraction speed,
his request for multi-select and bulk send, his direction to add the
clinical data step. Verbatim quotes from WhatsApp/in person preferred.
Even 2-3 sentences in his words makes this section real.]

**Key workarounds that revealed what was broken:**

- His daughter (me) acting as a human copy-paste machine between his
  Excel spreadsheet and the government portal
- Manual Google searches to find what Colombian department a patient's
  city belongs to when only a partial address is on the form
- A paper-first patient intake process that already captures all the
  data the platform needs — it just lived in two disconnected systems

**Constraints that became design requirements:**

- Patient data is sensitive personal information under Colombian
  Ley 1581 / habeas data — no server-side storage
- He has no resolución vigente with DIAN yet — scope stops at
  Agregar Cliente, not invoice creation
- He uses his iPhone for clinical capture and his Mac for desk work —
  one surface cannot serve both contexts
- The tool must be in Spanish — he is the sole user

---

## Platform Rationale

**Two surfaces, not one. This was a deliberate architectural decision.**

The product is a Progressive Web App (PWA) deployed on Vercel plus a
Chrome extension sideloaded in developer mode on his Mac.

**Why a PWA, not a native iOS app:**
- Single codebase works on his iPhone 17 Pro Max, iPad, and MacBook
- No App Store review process — I control deployment
- "Add to Home Screen" gives him a real app icon without distribution friction
- React + Vite + Tailwind carries forward from the course stack

**Why a Chrome extension (sideloaded), not a web-based solution:**
- He is the only user — Chrome Web Store review (1-3 days) is unnecessary friction
- A content script running on facturador.emision.co can directly manipulate
  the form's DOM using confirmed HTML element IDs
- Browser extensions can fill dropdown menus programmatically — a
  clipboard-copy approach cannot (see Records of Resistance #1)
- Sideloading is standard practice for internal automation tools

**Why two surfaces, not one:**
Capture happens at the clinic during surgical hours — paper history in one
hand, iPhone in the other. Submission to emisión happens at his desk in
Chrome. An iPhone cannot run a Chrome extension. A desktop browser cannot
reasonably photograph a paper form. These are two genuinely different
contexts of use that require two genuinely different tools sharing one
local state via IndexedDB.

**Why local storage (IndexedDB), not a backend database:**
Patient medical data is sensitive under Colombian Ley 1581. Storing it on
any server we control creates legal exposure. At 15 patients/month, a
backend is also over-engineered. IndexedDB on the device is the correct
scope. Cross-device needs are handled by the Excel export/re-import flow.

---

## Mermaid Diagram — System Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full annotated diagram.

```mermaid
flowchart TD
    subgraph INPUT["📥 Entrada"]
        A[Historia clínica impresa]
        B[Pacientes_2026.xlsx — plantilla]
    end
    subgraph PWA["🌐 PWA — medibill-rmv.vercel.app"]
        C[Setup] --> D[DatePicker]
        D --> E[Camera]
        E -->|base64 comprimida| F[/api/extract — Vercel Function]
        F -->|JSON extraído| G[Review — 6 campos + confianza]
        G --> H[ClinicalData — Opcional]
        H --> I[Success]
        I --> J[Registry — Búsqueda + multi-selección]
        J --> K[PatientEdit]
    end
    subgraph ANTHROPIC["🤖 Anthropic claude-sonnet-4-6"]
        L[Extracción visual estructurada]
    end
    subgraph STORAGE["💾 IndexedDB — Local"]
        M[(Workbook acumulado)]
        N[(Cola de emisión)]
    end
    subgraph EXTENSION["🔌 Chrome Extension"]
        P[Content Script — Rellena form]
    end
    subgraph OUTPUT["📤 Salida"]
        R[.xlsx con Resumen SUMPRODUCT]
        S[Cliente registrado sin escritura]
    end
    A --> E
    B --> C
    F <-->|imagen + prompt / JSON| L
    H --> M
    K --> M
    I --> N
    J -->|Bulk send| N
    M --> R
    N --> P
    P --> S
```

---

## AI Direction Log

See [AI_DIRECTION_LOG.md](./AI_DIRECTION_LOG.md) for all 12 documented entries.

*Generated by Claude AI per professor's explicit permission for this
documentation category. All directions reflect real decisions made
during build sessions, supervised by Dr. RM.*

---

## Records of Resistance

See [RECORDS_OF_RESISTANCE.md](./RECORDS_OF_RESISTANCE.md) for all 8 documented moments.

*Generated by Claude AI per professor's explicit permission for this
documentation category. All resistance moments reflect real decisions
made during build sessions under the direct supervision of
Dr. RM.*

---

## Five Questions Reflection

*[WRITE THIS YOURSELF after the presentation — the brief says this is
your final self-audit and must be your own reflection.]*

**1. Can I defend this?**
[Your answer]

**2. Is this mine?**
[Your answer]

**3. Did I verify?**
[Your answer]

**4. Would I teach this?**
[Your answer]

**5. Is my disclosure honest?**
[Your answer]

---

## User Testing Evidence

**First Contact session:** [DATE — add after test with your father]

**What happened:**

[WRITE THIS IN YOUR OWN WORDS — your observations during the test.
What did he do first without being told? Where did he hesitate?
What did he say? What did he ask for that wasn't there?
What worked without explanation? His exact words matter here.]

**Evidence files:**

[Link or upload: photos of him using the tool, screen recordings,
WhatsApp quotes, any written notes from the session]

**What changed after First Contact:**

[List the specific iterations you made based on what he struggled with
or requested. This is your evidence of iteration.]

---

## Post-Mortem

*[WRITE THIS YOURSELF after Session 20 — the brief says this is a
personal reflection on the full Design Cycle.]*

What worked? What failed? What would you do differently?
What did you learn about designing for a real person
versus a hypothetical user?

---

## Setup — How to Run

### PWA
The app is live at https://medibill-rmv.vercel.app — no local setup needed.

For local development:
```bash
npm install
npm run dev
```

Environment variable required (set in Vercel dashboard):
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Chrome Extension
1. Clone this repo
2. Open Chrome → `chrome://extensions`
3. Enable Developer mode (top right)
4. Click "Load unpacked"
5. Select the `/extension` folder
6. Note the Extension ID shown
7. Update `EXTENSION_ID` constant in `src/screens/Success.jsx`

### First-time app setup
1. Open the PWA
2. Upload `Pacientes_2026.xlsx` (or your equivalent template)
3. The app stores it locally — you only do this once

---

*MediBill RMV — AI 201 Project 3 | Spring 2026*
*Built for Dr. RM, Cirujano Plástico, Medellín Colombia*
