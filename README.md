# Truth & Bias Analyzer Chrome Extension

## Overview

The Truth & Bias Analyzer is a Chrome extension designed to help users critically evaluate web content. It analyzes the text of a webpage to provide insights into its potential truthfulness, falsehood, and political or social biases using the OpenAI API. Additionally, it allows users to select, highlight, and annotate portions of text for their own review and reflection.

## Features

*   **Webpage Text Analysis:** Automatically extracts main text content from visited pages and sends it for analysis.
*   **AI-Powered Insights:** Provides percentages for estimated truthfulness, falsehood, and detailed bias scores (political: left/right/neutral; social: progressive/conservative/neutral).
*   **On-Page Overlay:** Displays analysis results in a convenient, dismissible overlay on the current webpage.
*   **Text Highlighting & Annotation:** Users can select any text on a page, highlight it, and add a personal annotation (thought/note).
*   **Hover to View Annotations:** Hovering over highlighted text reveals the stored annotation.
*   **Powered by OpenAI:** Utilizes the OpenAI API (specifically, models like GPT-3.5 Turbo with JSON mode) for text analysis.

## Installation Instructions

1.  **Get the Extension Files:**
    *   **Option A (Recommended for development):** Clone this repository to your local machine using Git:
        ```bash
        git clone <repository_url>
        ```
    *   **Option B:** Download the source code as a ZIP file and extract it to a folder on your computer.

2.  **Load the Extension in Chrome:**
    *   Open Google Chrome.
    *   Navigate to `chrome://extensions` in the address bar.
    *   Ensure the **Developer mode** toggle (usually in the top-right corner) is **enabled**.
    *   Click the **Load unpacked** button.
    *   In the file dialog, select the directory where you cloned or extracted the extension files (this directory should contain `manifest.json`).
    *   The "Truth & Bias Analyzer" extension should now appear in your list of extensions.

## Configuration - OpenAI API Key (CRITICAL)

To use the text analysis features, you **must** configure the extension with your own OpenAI API key.

1.  **Obtain an OpenAI API Key:**
    *   If you don't have one, sign up at [OpenAI](https://platform.openai.com/) and generate an API key.

2.  **Set the API Key in the Extension:**
    *   Navigate to `chrome://extensions` in Chrome.
    *   Make sure "Developer mode" is still enabled.
    *   Find the "Truth & Bias Analyzer" extension card.
    *   Click on the **"service worker"** link (the text might vary slightly, e.g., "background page" in older versions or for manifest v2 extensions, but for Manifest V3 it's typically "service worker"). This will open the Chrome DevTools console for the extension's background script.
    *   In the **Console** tab of the DevTools window, paste the following command:
        ```javascript
        chrome.storage.local.set({ openaiApiKey: 'YOUR_API_KEY_HERE' }, () => { console.log('OpenAI API key stored successfully.'); });
        ```
    *   **IMPORTANT:** Replace `'YOUR_API_KEY_HERE'` with your actual OpenAI API key. Ensure the key is enclosed in single quotes.
    *   Press Enter to execute the command. You should see the confirmation message "OpenAI API key stored successfully." printed in the console.

    *   **Note on API Key Storage:** The API key is stored locally using `chrome.storage.local`. It is not synced across your devices and will remain on the computer where you set it.

## How to Use

1.  **Automatic Page Analysis:**
    *   Once the extension is installed and configured with an API key, it will automatically attempt to analyze the main content of most pages you visit.
    *   A small loading message ("Analyzing page...") will appear in the top-right corner.
    *   Once analysis is complete (or if an error occurs), an overlay will appear in the top-right corner of the page displaying the results.
    *   The overlay includes:
        *   Estimated truthfulness and falsehood percentages.
        *   Breakdown of political and social bias percentages.
        *   A brief summary from the AI.
        *   A status message (e.g., "Live Analysis", "API Error").
    *   Click the "×" button on the overlay to close it.

2.  **Text Highlighting and Annotation:**
    *   **Select Text:** On any webpage, use your mouse to select a portion of text you want to annotate.
    *   **Annotate:** After you release the mouse button, a prompt will appear asking you to "Enter your thought for the selected text". Type your annotation and click "OK".
    *   **View Highlight:** The selected text will become highlighted (yellow background with an underline).
    *   **View Annotation:** Hover your mouse cursor over any highlighted text to see the annotation you saved for it (displayed as a browser tooltip).

## Troubleshooting

*   **Analysis Overlay Shows "API Key not found" or "Analysis Error":**
    *   This is the most common issue. Double-check that you have correctly set your OpenAI API key using the instructions in the "Configuration - OpenAI API Key" section.
    *   Ensure your OpenAI account associated with the key is active and has available credits/quota.
    *   Open the service worker console (as described in API key setup) and look for more detailed error messages.
*   **No Analysis Overlay Appears at All:**
    *   Ensure the extension is enabled in `chrome://extensions`.
    *   Open the DevTools console for the *webpage itself* (Right-click on the page -> Inspect -> Console) and look for any errors related to the content script (`content.js`).
    *   The page might not have significant text content, or it might be structured in a way the extraction script cannot easily parse.
*   **Highlighting Doesn't Work:**
    *   Ensure you are selecting text and not clicking, or selecting text within an input field or editor.
    *   Check the webpage's console for errors. Some complex websites might interfere with the selection mechanism.

## Disclaimer

*   **AI Analysis is Not Infallible:** The truthfulness, falsehood, and bias percentages provided by the AI are estimates based on its training data and the provided text. They should not be taken as absolute facts. Always use your critical judgment and consult multiple sources.
*   **Privacy:**
    *   **Page Content:** To perform analysis, the textual content of the webpage you are viewing is sent to the OpenAI API. Refer to OpenAI's [API data usage policies](https://openai.com/policies/api-data-usage-policies) for how they handle data.
    *   **Annotations:** Your text highlights and annotations are currently stored locally on your computer using `chrome.storage.local` (associated with the highlighting feature, though full persistence isn't implemented yet for annotations). They are not transmitted anywhere else by this extension.

---
This README provides a comprehensive guide for users.
