# Records of Resistance — MediBill RMV
## AI 201 Project 3 | Valeria Múnera | Spring 2026

These are documented moments where I rejected or significantly 
revised AI output during the design and build of MediBill RMV. 
Every decision described here was made under the direct 
supervision and direction of Dr. Rodrigo Múnera Vélez, 
the tool's sole user and the person this product was built for. 
His real-world clinical knowledge and daily workflow experience 
were the primary standard against which all AI proposals were evaluated.

---

## Resistance #1 — The Copiar para Emisión Rejection STRONGEST ENTRY

**What AI proposed:**
A "Copiar para emisión" flow in which each patient field 
(name, ID, phone, address, email) would be copied to the 
clipboard one at a time. The user would manually tab between 
the MediBill app and the facturador.emision.co portal, 
pasting each field individually. The four required dropdown 
menus (Tipo de organización, Tipo de régimen, Responsabilidad 
fiscal, Detalles tributarios) would still require manual selection.

**What I said (verbatim from the build session, May 22):**
"Okay but like would this still require my dad to copy and paste? 
Because that is essentially what he already does switching tabs 
between his spreadsheet and the platform. This wouldn't really 
be a major change in his current workflow and I need to build 
something extraordinary that significantly reduces his admin 
work time."

**What I did instead:**
I rejected the clipboard flow entirely and demanded the 
architecture be elevated to a Chrome extension that fills 
every field — including the four default dropdowns — 
automatically, with zero manual typing. The result reduced 
per-patient submission time from approximately 3–4 minutes 
to under 20 seconds.

**Why this matters:**
This rejection came directly from my knowledge of my father's 
actual workflow. I had personally done this copy-paste work for 
him hundreds of times. AI produced a proposal that was 
technically functional but experientially identical to what 
already existed. My familiarity with the real problem — not 
an abstraction of it — is what identified the gap and forced 
the correct solution. This is the most important resistance 
in the project because it changed the fundamental architecture 
of the product.

---

## Resistance #2 — The Default Date Rejection

**What AI proposed:**
Default the session date to today's date on every app open, 
with an option to change it. The logic was standard UX 
convention: "users usually mean today."

**What I identified (from direct knowledge of his workflow):**
My father never adds patients the same day as their surgery. 
He photographs the paper histories on the day of surgery but 
processes the billing records days later, sometimes weeks later. 
Defaulting to today would mean he would always have to delete 
the wrong date and re-enter the correct one — making the 
interaction slower, not faster.

**What I did instead:**
Mandatory date selection with no default value. Every session 
begins with an empty date picker that requires a conscious 
choice. On iOS this opens the native date wheel, which is 
fast and familiar to him.

**Why this matters:**
AI generalized from standard UX patterns. My father's workflow 
violates that pattern. This resistance demonstrates that 
designing for a real person requires overriding even 
well-established conventions when they conflict with 
how that specific person actually works.

---

## Resistance #3 — The 12-Monthly-Sheets Assumption

**What AI assumed:**
Before seeing the real spreadsheet file, AI proposed routing 
each new patient to a different Excel sheet named by month 
(Enero, Febrero, Marzo... Diciembre) based on their surgery 
date. This seemed logical given that the design argument 
described monthly totals as a key requirement.

**What the real file revealed:**
When I provided my father's actual Pacientes_2026.xlsx file, 
AI discovered the spreadsheet is a single continuous sheet 
("Hoja 1") with approximately 1,010 pre-formatted rows 
sorted chronologically. No monthly sheets exist. The assumption 
was based on AI inference, not evidence.

**What I did instead:**
Required the architecture to change to a single-sheet append 
model, with a separate "Resumen" sheet generated on export 
containing SUMPRODUCT formulas that calculate monthly Factura 
Dian totals. His existing structure was preserved exactly.

**Why this matters:**
This is a resistance against AI assumptions made before evidence 
was introduced. My father's actual file — not my description 
of it, not AI's interpretation of it — determined the 
correct architecture. This reflects the project's core 
principle: the person, not the designer's assumptions about 
the person, determines the build.

---

## Resistance #4 — Extraction Speed Unacceptable for Clinical Workflow

**What AI built:**
The initial extraction pipeline used Claude Sonnet (a 
full-scale vision model) with no image compression, sending 
full-resolution iPhone photos directly to the API. 
Extraction took 30+ seconds per patient.

**What my father identified during supervision:**
During hands-on review of the tool, my father noted that the 
extraction process was taking far too long to be practical in 
a clinical setting. He processes patients before or after 
operating hours and needs the tool to be fast enough that 
it creates time savings rather than consuming them.

**What I said:**
"I don't think this is really satisfying the need. 
It is not possible to use this if it takes this long."

**What I did instead:**
Three simultaneous optimizations: (1) client-side image 
compression reducing photos from 10–15MB to approximately 
200KB before sending; (2) model switch from Sonnet to 
Claude Haiku, which is 3–5x faster for structured 
text extraction; (3) an animated loading indicator that 
shows field names appearing one by one ("Leyendo nombre... 
Leyendo documento...") to make the wait feel purposeful.

**Why this matters:**
A technically correct but clinically unusable tool fails 
the project's central test: does it help the person? 
My father's direct feedback during supervised testing 
drove a complete re-evaluation of the pipeline's 
performance requirements.

---

## Resistance #5 — Monthly Factura Dian Total Is a Regulatory Requirement, Not a Feature

**What AI treated as:**
A summary convenience feature — a "nice to have" monthly 
total at the bottom of the spreadsheet to help with 
accounting overview.

**What my father clarified:**
In Colombia, independent medical professionals calculate 
their monthly seguridad social (social security) contributions 
based on their declared monthly income. The sum of the 
Factura Dian column for a given month is the exact figure 
he submits to calculate his pension, health, and ARL 
(occupational risk insurance) payments. This number has 
legal and financial consequences if wrong.

**What I did instead:**
The Resumen sheet was elevated from a nice-to-have summary 
to a first-class, carefully structured deliverable. It 
includes SUMPRODUCT formulas for each of the 12 months 
(filtering by both month and year), a patient count per 
month, and a TOTAL 2026 row with yearly sums. Every formula 
was verified to correctly exclude placeholder rows from 
the original template.

**Why this matters:**
This resistance changed the stakes of the deliverable. 
What AI framed as a UX enhancement, my father's real 
professional context revealed to be a legal and financial 
tool. The design argument for the Resumen sheet is now 
grounded in Colombian regulatory reality, not in 
general accounting convenience.

---

## Resistance #6 — Single Camera Button Insufficient for Real Workflow

**What AI built:**
A single upload zone with one button that opened the 
device camera using the `capture="environment"` attribute.

**What the real workflow revealed:**
My father photographs patient histories at the clinic 
during consultation hours but often processes the billing 
records later at his desk. By then, the photos are in 
his camera roll, not being taken live. He needs two 
distinct paths: photograph a new form in real time, 
OR select an existing photo from his library.

**What I did instead:**
Redesigned the Camera screen with two separate, clearly 
labeled buttons: "Fotografiar historia clínica" (opens 
camera directly via capture="environment") and "Elegir 
de fotos o archivos" (opens the iOS native action sheet 
that lets him choose Camera, Photo Library, or Files). 
Desktop behavior also differs — the camera button 
attempts getUserMedia() webcam access while the library 
button opens a file picker.

**Why this matters:**
This resistance reflects a failure of AI to model the 
full temporal lifecycle of his workflow. Taking a photo 
and filing a billing record are two different activities 
that happen at different times and in different contexts. 
One button cannot serve both.

---

## Resistance #7 — Multi-Select Long-Press Doesn't Work on Desktop

**What AI built:**
A long-press gesture (500ms touchstart hold) to enter 
multi-select mode in the patient registry. Standard 
mobile UX pattern for list selection.

**What my father identified:**
He does his billing work on his MacBook Pro, not on 
his phone. Long-press is a touch gesture that does not 
reliably trigger on desktop browsers with a mouse.

**What I did instead:**
Replaced the long-press trigger with an explicit 
"Seleccionar" button in the registry header, visible 
at all times, that works identically with both mouse 
click and touch tap. This made multi-select functional 
across all his devices: iPhone, iPad, and MacBook.

**Why this matters:**
AI defaulted to mobile-native patterns without accounting 
for the fact that this user completes different steps 
of his workflow on different devices. Desktop usability 
was a real requirement, not an edge case.

---

## Resistance #8 — Privacy Gate on Cloud API (Dad's Direction)

**What AI proposed:**
Send real patient history photos directly to the 
Anthropic Claude API for extraction, assuming the 
cloud processing was acceptable.

**What I did:**
Brought the privacy question explicitly to my father 
before building. Explained that patient photos would 
cross international borders to a US-based AI provider 
operating under different data retention policies than 
Colombian Ley 1581 / habeas data requires.

**What my father decided:**
For the class deliverable and all testing, only 
de-identified or fabricated patient data may be sent 
through the API. Real patient data processing requires 
updated patient consent forms reviewed by legal counsel 
before production use.

**What changed:**
All class deliverable testing used fabricated patient 
records with real-format but fake data. The case study 
is honest about this limitation. The tool's architecture 
supports real patient data but the operational scope 
for the class is clearly defined.

**Why this matters:**
My father is a physician. His patients' data is regulated 
sensitive personal information. Proceeding without his 
explicit informed direction would have been ethically 
wrong regardless of technical legality. His consent 
posture shaped the entire class deliverable scope.

---

## Resistance #9 — The Google Slideshow Rejection

**What AI proposed:**
A 60-second commercial built entirely in Claude Code 
using ffmpeg to animate static screenshots with Ken 
Burns zoom effects, crossfade transitions, and a Mac 
`say` command voiceover. The result was delivered as 
two MP4 files (16:9 and 9:16) with text cards, 
panning effects, and a synthesized ambient music pad.

**What I said (verbatim from the session):**
"I don't think I like this... what I don't like is 
that if Claude is going to take the motion media 
approach, it should do it in a cool fast paced way, 
not just like a google slideshow."

**What I did instead:**
Rejected the entire ffmpeg-animated-screenshot 
approach and directed a full rebuild using Higgsfield 
AI video generation for real cinematic motion clips — 
Medellín aerial footage, a surgeon walking a clinic 
corridor, hands setting down paper forms, a phone 
photographing a document, a checkmark tap. These 
replaced the Ken Burns zoom on PNGs entirely. 
Assembly moved to CapCut for manual, precise 
editorial control.

**Why this matters:**
AI defaulted to what was technically achievable with 
the tools already in use (ffmpeg, Claude Code) rather 
than what the deliverable actually required. A 
Marketing Minute is a commercial, not a screen 
recording with transitions. My rejection forced a 
complete rethinking of the production pipeline — 
from automated script to human-directed editorial 
assembly — and the $50 Higgsfield investment was 
my decision to make the tool match the ambition 
of the deliverable.

---

## Resistance #10 — The Corny Voiceover Rejection

**What AI proposed:**
A 12-line voiceover script telling the full story of 
my father's technological dependency, my departure 
for college, the 18-minute billing process, and the 
tool's resolution. Lines included: "Every surgeon in 
Medellín has a story," "His hands save lives," "When 
his daughter left for college... he was left alone 
with the forms," and "So she built something."

**What I said:**
"This is too corny I don't like it, it is too 
personal and trying too hard to story tell."

**What I did instead:**
Rejected the narrative voiceover entirely and 
directed a minimal script of five lines total, with 
long intentional silences through most of the 
commercial. The only lines kept were the two most 
functional: "Too many forms. Too little time." as 
the problem statement, "Eighteen minutes. Down to 
two." as the proof point, and "Your time is yours. 
Invest it in what truly matters." as the tagline. 
The emotional weight of the ad was shifted to the 
visuals and the silence — not the narration.

**Why this matters:**
AI defaulted to storytelling because it had access 
to the story. But the strongest advertisements do 
not explain their emotional content — they create 
conditions for the viewer to feel it. My rejection 
came from an instinct about what a real commercial 
sounds like: confident, spare, and trusting of the 
audience. The story is in the images. The voice 
is there to punctuate, not narrate.

---

## Resistance #11 — The Mac Voice Rejection

**What AI built:**
A voiceover pipeline using the Mac `say` command 
with the Samantha voice at rate 145, converted from 
AIFF to WAV via ffmpeg. This was presented as a 
free, no-additional-cost solution built directly 
into the Claude Code pipeline.

**What I said:**
"The voice absolutely gross."

**What I did instead:**
Rejected the synthesized system voice entirely and 
used ElevenLabs with the Charlotte voice instead, 
generating each line separately and downloading as 
MP3 files that were then converted to WAV via ffmpeg 
for CapCut compatibility. This required a separate 
account and produced a genuinely human-sounding 
result with natural breath, cadence, and emotional 
register appropriate for a premium brand commercial.

**Why this matters:**
A robotic voiceover on a commercial built to 
represent my father's professional brand would have 
undermined the entire visual effort. The `say` 
command voice is adequate for accessibility features 
and screen readers — it is not adequate for 
advertising. AI optimized for pipeline integration 
and cost; I optimized for the final product's 
quality. These are different objectives and mine 
was correct.

---

## Resistance #12 — The Failed Assembly Rejection

**What AI built:**
A second full video assembly after the slideshow 
rejection, this time incorporating the Higgsfield 
clips. The result had wrong text content that was 
never approved, fabricated cards not in the agreed 
storyboard, a grainy filter applied by ffmpeg, 
voiceover timing misaligned with the visual beats, 
and the robotic Mac voice despite the ElevenLabs 
discussion.

**What I said:**
"Why does it have text that we did not agree on, 
additionally it is ridiculously slow and why does 
it have a random grainy filter and why is the text 
so badly placed in comparison to the voiceover and 
why is the voice absolutely gross."

**What I did instead:**
Rejected the automated assembly pipeline entirely. 
Moved all final assembly to CapCut, a professional 
video editing application, where I had direct manual 
control over every cut point, every audio placement, 
every transition, and every text card. The ElevenLabs 
WAV files were imported and placed frame-accurately. 
No automated script touched the final edit.

**Why this matters:**
This resistance documents the fundamental limitation 
of using a code-execution environment as a substitute 
for a video editor. Claude Code with ffmpeg can 
concatenate clips and apply filters — it cannot make 
editorial judgments, honor approved storyboards, or 
produce broadcast-quality audio mixing. The two 
failed automated assemblies consumed significant 
time and credits. The manual CapCut assembly took 
less time and produced a better result. For creative 
deliverables with precise timing requirements, the 
right tool is a timeline editor operated by the 
person who knows what the final product should 
look like.

---

## Resistance #13 — The Missing Pain Identified

**What the AI-directed shot list contained:**
B-roll clips of Medellín at night, a surgeon walking 
a corridor, paper forms on a desk, a phone 
photographing a document, and a checkmark 
confirmation tap. The storyboard moved from 
"paper forms exist" directly to "phone 
photographs the form."

**What I identified:**
The ad was showing the problem as an object — a 
stack of paper — without showing the act of 
suffering through it. There was no clip that 
depicted what my father actually did every night: 
sitting at a laptop, picking up a paper form, 
reading a field, typing it in, setting the form 
down, picking it up again, repeating for every 
patient. That repetitive physical action is the 
real antagonist of the commercial, not the 
paper itself.

**What I did instead:**
Directed an additional Higgsfield generation 
specifically for this moment: an overhead close-up 
of surgeon's hands moving slowly between a paper 
medical form and a laptop keyboard, picking up the 
paper to read it, setting it down, typing, picking 
it up again — shot in slow motion with shallow 
depth of field, no face visible. This clip was 
inserted between the paper forms clip and the phone 
photographing clip, creating a three-beat visual 
sequence: here is the problem, here is the pain of 
living with it, here is the moment it ends.

**Why this matters:**
This addition came entirely from my knowledge of 
what my father's actual workflow looked like — I 
had done this work alongside him hundreds of times. 
AI generated a competent shot list from the 
narrative I provided. It did not know that the 
most important image in the commercial was the one 
that showed the repetition, because repetition is 
what makes the before state feel unbearable. That 
insight was mine.

---

*Total documented resistance entries: 13*
*All decisions made under the direct supervision of 
Dr. Rodrigo Múnera Vélez, the tool's sole user.*
