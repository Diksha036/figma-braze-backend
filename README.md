That is fantastic news! I am thrilled that it is working perfectly for you. Building a custom pipeline between a design tool and an enterprise marketing platform is no small feat.

Here is a complete, professional `README.md` file that you can copy and paste into your GitHub repository. It includes a text-based architecture diagram and a detailed breakdown of exactly how your new system works.

---

# 📧 Figma to Braze HTML Email Exporter

This project is a custom Figma plugin and serverless proxy that seamlessly translates Figma designs into editable HTML email templates inside the Braze CRM.

Instead of exporting a single, flat image (which is bad for email accessibility and personalization), this pipeline slices the design, extracts editable text, automatically uploads image assets to the Braze Media Library, and compiles a responsive HTML table directly into your Braze dashboard.

## 🏗️ Architecture Diagram

```text
┌─────────────────────────────────┐
│          FIGMA CLIENT           │
│                                 │
│  1. code.js (The Extractor)     │
│  Reads layers, extracts text,   │
│  and exports shapes as PNGs.    │
│            │                    │
│            ▼                    │
│  2. ui.html (The Orchestrator)  │
│  Receives data, compiles HTML,  │
│  and powers the live UI log.    │
└────────────┬────────────────────┘
             │
             │ HTTPS POST (Base64 + JSON)
             ▼
┌─────────────────────────────────┐
│     VERCEL SERVERLESS PROXY     │
│                                 │
│  3. api/braze-proxy.js          │
│  Bypasses Figma CORS limits.    │
│  Converts JSON to strict        │
│  Multipart Form-Data for Braze. │
└────────────┬────────────────────┘
             │
             ├─ Step A: Upload Images (Multipart Form)
             ├─ Step B: Get CDN URLs back from Braze
             └─ Step C: Send compiled HTML string (JSON)
             │
             ▼
┌─────────────────────────────────┐
│         BRAZE PLATFORM          │
│                                 │
│  ▶ Braze Media Library (CDN)    │
│    (Hosts individual images)    │
│                                 │
│  ▶ Email Templates Dashboard    │
│    (Holds final editable HTML)  │
└─────────────────────────────────┘

```

---

## ⚙️ Component Breakdown

### 1. `code.js` (Figma Main Thread)

Figma plugins run in a highly restricted sandbox. `code.js` is the only file allowed to directly "touch" the Figma canvas.

* **What it does:** When you click export, it reads the selected Frame. It sorts the children from top to bottom (based on their Y-axis position).
* **Text Processing:** If it finds a text layer, it extracts the raw characters, font size, color, and alignment.
* **Image Processing:** If it finds a group, shape, or image, it silently commands Figma to generate a PNG byte-array at 1.5x scale (ensuring high resolution while staying under Braze's 5MB limit).
* **Handoff:** It packages all this data into an array and sends it to the UI thread.

### 2. `ui.html` (Figma UI & Orchestrator)

This file is the "brain" of the operation. Because `code.js` cannot make network requests easily, the UI iframe handles the internet connection.

* **User Interface:** Provides the input fields for API keys, endpoints, and the real-time logging terminal.
* **HTML Generation:** It loops through the data sent by `code.js`. It converts Figma text data into styled `<tr><td>` blocks.
* **Asset Coordination:** For every image, it converts the raw bytes into a Base64 string and sends it to the Vercel Proxy. It waits for Braze to return the live CDN URL, and injects that URL into an `<img src="...">` tag.
* **Final Assembly:** It wraps the rows in a responsive email table structure and fires the final command to create the template.

### 3. `api/braze-proxy.js` (Vercel Serverless Backend)

Figma plugins are subject to strict CORS (Cross-Origin Resource Sharing) policies, and Braze's Media Library is highly specific about how it receives files. This proxy acts as a translator.

* **CORS Bypass:** It accepts requests from Figma (`*` origin) so the browser doesn't block the connection.
* **Multipart Formatting (Crucial):** Braze's `/media_library/create` endpoint *requires* binary data attached to a field named exactly `asset_file`. Sending JSON breaks it. The proxy uses `form-data` to repackage the Base64 string from Figma into a true Multipart file stream.
* **Routing:** It securely forwards the `create_template` JSON payloads directly to the Braze REST API.

---

## 🔄 The Step-by-Step Execution Flow

When a user clicks **"Export HTML to Braze"**, the following sequence occurs:

1. **Extraction:** `code.js` identifies that the frame has 1 text block and 2 image blocks.
2. **First API Call (Proxy):** `ui.html` sends Image 1 to Vercel.
3. **Translation:** Vercel formats Image 1 as an `asset_file` and sends it to Braze. Braze replies with `https://cdn.braze.com/.../image1.png`.
4. **Second API Call (Proxy):** `ui.html` repeats this process for Image 2.
5. **Compilation:** `ui.html` combines the text block, the CDN link for Image 1, and the CDN link for Image 2 into a single string of HTML code.
6. **Final API Call (Proxy):** `ui.html` sends the complete HTML string and the "Email Subject" to Vercel, which forwards it to Braze's `/templates/email/create` endpoint.
7. **Success:** The Braze dashboard instantly reflects the new, editable email template.

---

## 🛠️ Setup & Dependencies

**Figma Configuration (`manifest.json`):**
Requires `"networkAccess": { "allowedDomains": ["https://your-vercel-proxy.vercel.app"] }` to allow external connections.

**Vercel Configuration (`package.json`):**
The serverless function relies on the modern ES-module syntax and two critical packages to handle the file streams:

* `"node-fetch": "^3.3.0"`
* `"form-data": "^4.0.0"`
* `"type": "module"`
