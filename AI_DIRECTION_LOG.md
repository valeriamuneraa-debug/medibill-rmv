# AI Direction Log — MediBill RMV
## AI 201 Project 3 | Valeria Múnera | Spring 2026

This log documents what I asked AI to do, what it produced, 
and what I changed, kept, or rejected — and why. All entries 
reflect decisions made under the direct supervision of 
Dr. Rodrigo Múnera Vélez, whose workflow requirements and 
real-world clinical context informed every direction given.

---

## Entry 1 — Platform Decision: PWA + Chrome Extension

**What I asked AI to do:**
Design a platform for my father to photograph patient 
histories, extract billing data, and submit it to the 
Colombian government invoicing portal (e-Misión).

**What AI initially produced:**
A single Progressive Web App (PWA) deployed on Vercel 
that would handle all steps including a clipboard-copy 
flow for transferring data into the emisión portal.

**What I changed and why:**
After reviewing the clipboard flow (see Records of 
Resistance #1), I directed AI to expand the architecture 
to two surfaces: the PWA for photo capture and spreadsheet 
management, and a Chrome extension that auto-fills the 
emisión form directly including all dropdown menus. 
The two-surface decision was driven by my father's 
actual workflow: capture happens on his phone during 
clinical hours, billing submission happens at his Mac. 
No single surface serves both contexts well.

**Outcome:** PWA deployed at medibill-rmv.vercel.app + 
Chrome extension sideloaded in developer mode. Both 
share state via chrome.storage.local.

---

## Entry 2 — Cloud API Decision and Privacy Posture

**What I asked AI to do:**
Present the options for how patient history photos 
would be processed to extract billing fields.

**What AI produced:**
Four options: (A) cloud vision API (Claude), 
(B) on-device OCR (Tesseract.js), 
(C) manual entry only, 
(D) hybrid. AI presented the tradeoffs including 
the privacy implications of each.

**What I changed and why:**
I took the options to my father directly. He chose 
Option A (cloud API) with the explicit condition 
that only de-identified/fabricated patient data 
would be used for the class deliverable. This shaped 
the entire testing protocol: all First Contact 
testing and class demonstrations use fake patient 
records in the real form format. Production use 
of real patient data requires updated consent forms 
reviewed by legal counsel.

**Outcome:** Claude API (Sonnet 4, then Haiku for 
speed) used for extraction. API key stored as Vercel 
environment variable, never in client code.

---

## Entry 3 — Date Entry Flow: No Default

**What I asked AI to do:**
Design the first screen the user sees every session.

**What AI produced:**
A date picker that defaulted to today's date with 
an option to change.

**What I changed and why:**
My father never adds patients the same day as their 
surgery. He processes billing records days or weeks 
after the clinical encounter. Today is almost never 
the right date. I directed AI to remove the default 
entirely — the date picker starts empty, and the 
"Continuar" button is disabled until he consciously 
selects a date. This eliminates a predictable error 
without adding friction for the rare case when today 
is correct.

**Outcome:** Mandatory date selection with no default. 
Native iOS date wheel on mobile.

---

## Entry 4 — Spreadsheet Structure Correction

**What I asked AI to do:**
Build the Excel export logic that routes each patient 
to the correct monthly sheet.

**What AI produced:**
Logic that wrote patients to 12 separate sheets 
(Enero, Febrero, Marzo... Diciembre) based on the 
month of their surgery date. This assumption was 
made before seeing the real file.

**What I changed and why:**
I provided the actual Pacientes_2026.xlsx file. 
The real spreadsheet is a single continuous sheet 
("Hoja 1") with approximately 1,010 pre-formatted 
rows. No monthly sheets exist. I directed AI to 
rewrite the export logic to append rows 
chronologically to Hoja 1, with a separate "Resumen" 
sheet generated on export containing SUMPRODUCT 
formulas for monthly Factura Dian totals — 
a requirement driven by my father's social security 
calculation needs.

**Outcome:** Single-sheet append preserving his exact 
template structure. Resumen sheet with 12 monthly 
SUMPRODUCT formulas and yearly totals.

---

## Entry 5 — Branding Extraction and Visual Identity

**What I asked AI to do:**
Extract my father's brand colors and typography from 
his logo files for use in the app's visual design.

**What AI produced:**
Rendered logo2.pdf to PNG, sampled the exact navy 
hex (#172137) and white, identified that the typographic 
treatment used geometric uppercase letterforms with 
generous letter-spacing, and recommended Outfit 
(Google Fonts) as the closest freely available match 
to the logo's typeface character. Built the full 
design system: navy #172137 background, white 
primary, Outfit font throughout, letter-spacing 0.3em 
for headings.

**What I kept:**
All of it. The color match was exact — confirmed by 
pixel sampling the rendered logo. The Outfit 
recommendation was accurate to the visual language 
of his existing brand materials.

**Outcome:** The app's entire visual identity — 
colors, typography, the RMV monogram treatment — 
is derived directly from his existing professional 
brand. The tool looks like his tool, not a generic 
SaaS product.

---

## Entry 6 — Camera Screen: Two-Button Separation

**What I asked AI to do:**
Build the screen where my father photographs 
or uploads a patient history form.

**What AI initially produced:**
A single upload zone with one button that opened 
the device camera.

**What I changed and why:**
My father photographs forms at the clinic in real 
time but also processes photos from his camera roll 
later at his desk. One button cannot serve both 
contexts. I directed AI to separate the interaction 
into two explicit options: "Fotografiar historia 
clínica" (opens camera directly) and "Elegir de 
fotos o archivos" (opens photo library/file picker). 
PDF support was also added after my father noted 
that some patient records arrive as PDF documents.

**Outcome:** Two-button camera screen with 
capture="environment" for live photo, standard file 
picker for gallery/PDF selection. Both inputs accept 
image/* and application/pdf.

---

## Entry 7 — Performance Optimization for Clinical Speed

**What I asked AI to do:**
Evaluate and fix the extraction pipeline after 
my father identified it as too slow during 
supervised testing.

**What AI produced initially:**
A pipeline using Claude Sonnet (full model) with 
no image compression, taking 30+ seconds per 
patient photo.

**What I directed AI to change:**
Three simultaneous optimizations after my father's 
direct feedback that the tool was not fast enough 
for clinical use:
(1) Client-side image compression before API call: 
    max 1,200px longest side, JPEG quality 0.7, 
    reducing payload from ~10MB to ~200KB
(2) Model switch from Sonnet to Claude Haiku 
    (claude-haiku-4-5-20251001): 3-5x faster for 
    structured text extraction on printed forms
(3) Animated loading indicator showing field names 
    appearing one by one to make the wait feel 
    purposeful rather than blank

**Outcome:** Extraction time reduced from 30+ seconds 
to 4-8 seconds. My father confirmed this was 
acceptable for his workflow.

---

## Entry 8 — Chrome Extension Field Mapping via DOM Diagnostic

**What I asked AI to do:**
Build the Chrome extension content script to 
auto-fill the facturador.emision.co Agregar Cliente form.

**What AI produced:**
A content script using CSS selectors based on label 
text matching (findInputByLabel function) and 
generic attribute patterns. The selectors failed 
to target the correct fields — only the patient 
name filled correctly, all other fields remained empty.

**What I directed AI to change:**
Rather than guessing at selectors, I ran a DOM 
diagnostic directly in Chrome DevTools Console 
on the live emisión form:

document.querySelectorAll('select').forEach((s,i) => {
  console.log(i, s.name, s.id, 
    Array.from(s.options).map(o=>o.text));
});

This revealed exact field IDs: client_name, 
client_document_number, identification_type_id, 
client_organization_type, client_regime_type, 
tax_responsibility_id, client_tax_detail_id, 
department_id, municipality_id, client_gender, 
client_phone, client_email, client_address_1.

I directed a complete rewrite using these confirmed 
IDs with text-matching option selection and 
1,500ms delay for the department→city dependent 
dropdown cascade.

**Outcome:** Extension fills all form fields 
correctly on first load including the four 
always-same dropdown values that previously 
required manual selection every time.

---

## Entry 9 — Resumen Sheet Elevated to Regulatory Tool

**What I asked AI to do:**
Add a monthly summary to the exported spreadsheet.

**What AI produced:**
A basic SUM formula at the bottom of the 
Factura Dian column — a simple running total.

**What I directed AI to change:**
After my father clarified that the monthly Factura 
Dian total is the input for his Colombian seguridad 
social calculation (pension, health, ARL insurance 
contributions), the summary was redesigned as a 
structured regulatory tool:

- Separate "Resumen" sheet (not inline)
- 12 monthly rows with SUMPRODUCT formulas filtering 
  by both month AND year
- Patient count per month (SUMPRODUCT with name 
  length filter to exclude placeholder rows)
- TOTAL 2026 row with yearly SUM formulas
- Colombian peso currency formatting

**Outcome:** The Resumen sheet is now the most 
important sheet in the exported file. It contains 
the exact numbers my father submits monthly to 
calculate his legal social security obligations.

---

## Entry 10 — Multi-Select and Bulk Actions (Dad's Direction)

**What I asked AI to do:**
Add patient selection functionality to the 
Registry screen.

**What AI built first:**
Long-press gesture (500ms touch hold) to enter 
multi-select mode — standard mobile UX pattern.

**What my father identified:**
He conducts billing work on his MacBook Pro, 
where long-press does not trigger on mouse input. 
He also requested: (1) select all option, 
(2) bulk send to emisión queue, 
(3) bulk delete with confirmation that 
also removes rows from the Excel database.

**What I directed:**
Replace long-press with explicit "Seleccionar" 
button always visible in the header. In selection 
mode: checkboxes on each row, "Seleccionar todo" 
toggle, bulk action bar at bottom with 
"→ Emisión" and "Eliminar" buttons. Delete 
removes matching rows from SheetJS workbook 
in IndexedDB by ID number (column C) and 
saves back.

**Outcome:** Multi-select works identically 
on iPhone (touch), iPad (touch), and MacBook 
(mouse). Bulk operations confirmed functional 
by my father during supervised testing.

---

## Entry 11 — Clinical Data Step Before Success (Dad's Direction)

**What was originally built:**
Flow went directly from Review screen 
(confirm extracted data) to Success screen.

**What my father identified:**
He needs to add clinical and billing data 
(Procedimiento, Presupuesto, Clínica, Implantes, 
Instrum, Tiempo, Factura Dian) at the time of 
entry, not only later via the Registry edit screen. 
This data is in his head right after surgery — 
he should be able to capture it in the same session.

**What I directed:**
Intermediate ClinicalData screen between Review 
and Success. Seven optional fields (none mandatory). 
Two navigation options: "Guardar y continuar" 
(saves all data to workbook) or "Continuar sin 
completar" (saves only the extracted fields, 
clinical data can be filled later from Registry).

**Outcome:** My father can complete an entire 
patient record — from photo to full billing data 
— in a single session without switching to 
the Excel file.

---

## Entry 12 — Template Migration Without Data Loss (Dad's Direction)

**What was originally built:**
"Reestablecer plantilla" completely cleared 
IndexedDB and required a fresh template upload, 
losing all previously entered patient data.

**What my father identified:**
He may need to update his Excel template 
(column changes, formatting updates) without 
losing the patients already entered. Wiping 
everything on a template change is unacceptable.

**What I directed:**
Template reset now offers two options:
Option A: "Mantener pacientes existentes" — 
extracts real patient rows from the current 
workbook (filtering out placeholder rows where 
Nombre = "Nombre" or length ≤ 6), loads the 
new template, re-appends those rows to the 
new structure.
Option B: "Borrar todo y empezar desde cero" — 
original behavior, with explicit confirmation.

**Outcome:** My father can update his template 
structure at any point without losing the 
patient records accumulated in the current year.

---

## Entry 13 — Marketing Minute Production Strategy

**What I asked AI to do:**
Help me build a 60-second Marketing Minute 
commercial for the class deliverable, in a way 
that was genuinely advertising-quality rather 
than a product demo.

**What AI initially produced:**
A Claude Code ffmpeg pipeline that animated app 
screenshots with Ken Burns zooms and crossfade 
transitions, used the Mac `say` command for 
voiceover, and synthesized sound effects 
programmatically. The result looked like a 
Google Slides export with audio.

**What I changed and why:**
After seeing the output, I rejected the entire 
approach and directed a three-tool production 
pipeline instead: Higgsfield for AI-generated 
cinematic b-roll and animated app clips, 
ElevenLabs for human-quality voiceover, and 
CapCut for manual editorial assembly. I also 
identified that the commercial needed real 
narrative b-roll — not just animated 
screenshots — and directed a specific shot list 
based on my father's actual clinical environment: 
Medellín aerial, surgeon walking, hands copying 
paper to keyboard, phone photographing the form, 
app reveal, checkmark tap.

**Outcome:** A 60-second commercial assembled in 
CapCut from 8 Higgsfield-generated clips, 5 
ElevenLabs voiceover lines recorded with the 
Charlotte voice, and manually placed title cards 
matching the approved storyboard exactly.

---

## Entry 14 — Voiceover Script Direction

**What I asked AI to do:**
Write a voiceover script for the 60-second 
commercial based on the story of my father's 
workflow and the tool's impact.

**What AI produced:**
A 12-line narrative script covering my father's 
technological dependency, my departure for 
college, the per-patient time cost, and the 
tool's resolution. Emotionally explicit, 
story-driven, first-person perspective of the 
daughter building the tool for her father.

**What I changed and why:**
Rejected the narrative approach as too corny and 
trying too hard to storytell. Directed a minimal 
script of five lines total with intentional 
silence through most of the commercial. Specified 
a combination of Option C (near-silent, music and 
visuals carrying the weight) and Option A 
(factual numbers as the only verbal proof point). 
The approved lines: "Too many forms." / "Too 
little time." / "Eighteen minutes. Down to two." 
/ "Your time is yours." / "Invest it in what 
truly matters." Everything else was silence.

**Outcome:** Charlotte (ElevenLabs) recorded all 
five lines. Voiceover placed at precise timestamps 
in CapCut: lines 1–2 during the b-roll problem 
sequence, line 3 during the 18→2 text card, 
lines 4–5 during the closing tagline card. 
Total spoken words in the commercial: 21.

---

*Total logged entries: 14*
*Minimum required: 5*
*All directions given under supervision of 
Dr. Rodrigo Múnera Vélez, the tool's sole user.*
*The AI Direction Log and Records of Resistance 
were generated by Claude AI per professor's 
explicit permission for these documentation 
categories.*
