# Ootophia Label & Mockup Generator

A specialized design tool for **Ootophia**, a premium coffee brand. This application allows users to generate high-quality coffee bag labels and visualize them on professional mockups with AI-driven artistic backgrounds.

## 🌟 Key Features

### 1. Dynamic Label Generator
*   **Real-time Rendering:** Instant updates to the label design as you change product data.
*   **Custom Typography:** Uses "Playfair Display" for titles and "Inter" for technical details.
*   **Automatic Color Coding:** Titles automatically change color based on the product lineup (Bloementuin, Fruittuin, Bombarderen).
*   **Template Support:** Upload your own label templates to use as a base.

### 2. Professional Mockup Visualizer
*   **Multi-Label Support:** Place multiple labels on a single mockup (Single/Double bag views).
*   **Advanced Controls:** Adjust position (X/Y), scale, rotation, opacity, and blend modes for each label.
*   **Perspective Rendering:** Labels are rendered with soft drop shadows to ground them realistically in the scene.

### 3. AI-Powered Backgrounds (Gemini API)
*   **Renaissance Scene Mode:** Generates a high-quality oil painting background based on the product's character:
    *   **Bloementuin (Floral):** Lush flower gardens with Dutch still life aesthetics.
    *   **Fruittuin (Fruity):** Bountiful fruit orchards with warm sunlight.
    *   **Bombarderen (Funky):** Dramatic, experimental, and surreal artistic scenes.
*   **Smart Composition:** The AI is instructed to keep the center clear for the product mockup and apply a slight blur for depth.

### 4. Warm Gradient Mode
*   **Tasting Note Extraction:** Automatically builds a color palette from keywords like "Blueberry", "Cherry", "Lime", "Honey", etc.
*   **Renaissance Palette:** Uses a curated set of warm, muted, and classical tones (Ochre, Madder Red, Olive, Parchment) to maintain brand consistency.
*   **Artistic Texture:** Adds a subtle grain/noise texture to the gradients for a premium feel.

### 5. Workflow Tools
*   **History System:** Full Undo/Redo support for all design changes.
*   **High-Res Export:** Export your final mockup in PNG or JPG format with adjustable quality.
*   **Responsive Design:** Desktop-first precision with a polished, professional UI.

## 🛠 Tech Stack

*   **Frontend:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS 4.0
*   **AI Integration:** Google Gemini API (`gemini-2.5-flash-image`)
*   **Icons:** Lucide React
*   **Animations:** Motion (formerly Framer Motion)
*   **Canvas API:** Custom high-performance rendering for labels and mockups.

## 📁 Project Structure

*   `/src/App.tsx`: Main application logic and rendering engine.
*   `/src/useHistory.ts`: Custom hook for undo/redo state management.
*   `/src/index.css`: Global styles and Tailwind configuration.
*   `/public/`: Static assets and fonts.

## 🚀 Getting Started

1.  **Environment Variables:** Ensure `GEMINI_API_KEY` is set in your environment to enable AI background generation.
2.  **Installation:**
    ```bash
    npm install
    ```
3.  **Development:**
    ```bash
    npm run dev
    ```
4.  **Build:**
    ```bash
    npm run build
    ```

## 🎨 Brand Guidelines (Ootophia)

This tool is built to respect the Ootophia brand image:
*   **Typography:** Elegant, classical, and legible.
*   **Color Palette:** Warm, earthy, and Renaissance-inspired.
*   **Imagery:** Masterpiece-quality oil paintings and smooth, textured gradients.

---
*Developed for Ootophia - Elevating Coffee Presentation.*
