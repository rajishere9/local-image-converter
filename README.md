# Local Image Converter

A web application built with Next.js, Tailwind CSS, and shadcn/ui that allows you to convert images locally in your browser. No files are uploaded to any server.

## Features

*   **Client-Side Conversion:** All image processing happens directly in your browser using the Canvas API and JavaScript libraries.
*   **Multiple File Support:** Convert up to 50 images at once.
*   **Drag and Drop:** Easily add images by dragging them onto the application.
*   **Format Support:** Convert images to JPEG, PNG, WEBP, BMP, and GIF.
*   **JPEG Quality Control:** Adjust the quality slider for JPEG output (0-100).
*   **Image Previews:** See thumbnails of selected images before conversion.
*   **Progress Indicator:** View the progress during batch conversions.
*   **Individual Downloads:** Download converted files one by one.
*   **Download All (ZIP):** Download all converted files conveniently bundled in a zip archive.
*   **Responsive Design:** Usable on various screen sizes.

## Tech Stack

*   [Next.js](https://nextjs.org/) (React Framework)
*   [Tailwind CSS](https://tailwindcss.com/) (Utility-First CSS Framework)
*   [shadcn/ui](https://ui.shadcn.com/) (UI Components)
*   [React Dropzone](https://react-dropzone.js.org/) (File Drag and Drop)
*   [gif.js](https://github.com/jnordberg/gif.js) (GIF Encoding)
*   [JSZip](https://stuk.github.io/jszip/) (ZIP File Creation)
*   [FileSaver.js](https://github.com/eligrey/FileSaver.js/) (File Saving Utility)
*   [TypeScript](https://www.typescriptlang.org/)

## Getting Started

### Prerequisites

*   Node.js (Version 18.x or later recommended)
*   npm, yarn, or pnpm

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/local-image-converter.git # Replace with actual URL later
    cd local-image-converter
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1.  Drag and drop image files onto the designated area, or click to select files (up to 50).
2.  Select the desired output format from the dropdown menu.
3.  If JPEG is selected, adjust the quality slider (optional).
4.  Click the "Convert X File(s)" button.
5.  Wait for the conversion process to complete (progress is shown).
6.  Download individual files using the download icon next to each file in the list, or click "Download All (.zip)" to get a zip archive.
7.  Click the 'X' button next to the file count to clear the selection and results.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (We will add this file later).
