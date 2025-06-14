const LOADING_OVERLAY_ID = 'truthBiasLoadingOverlay';
const ANALYSIS_OVERLAY_ID = 'truthBiasOverlay';

function showLoadingIndicator() {
  hideLoadingIndicator(); // Remove any existing one first
  const existingAnalysisOverlay = document.getElementById(ANALYSIS_OVERLAY_ID);
  if (existingAnalysisOverlay) existingAnalysisOverlay.remove();


  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = LOADING_OVERLAY_ID;
  loadingOverlay.style.position = 'fixed';
  loadingOverlay.style.top = '20px';
  loadingOverlay.style.right = '20px';
  loadingOverlay.style.padding = '15px';
  loadingOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  loadingOverlay.style.border = '1px solid #ccc';
  loadingOverlay.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.2)';
  loadingOverlay.style.zIndex = '10000'; // Higher than analysis overlay potentially
  loadingOverlay.style.maxWidth = '300px';
  loadingOverlay.style.fontFamily = 'Arial, sans-serif';
  loadingOverlay.style.fontSize = '16px';
  loadingOverlay.style.color = '#333';
  loadingOverlay.textContent = 'Analyzing page... Please wait.';

  document.body.appendChild(loadingOverlay);
}

function hideLoadingIndicator() {
  const loadingOverlay = document.getElementById(LOADING_OVERLAY_ID);
  if (loadingOverlay) {
    loadingOverlay.remove();
  }
}

function displayAnalysisOverlay(analysisData, status) {
  hideLoadingIndicator(); // Ensure loading indicator is hidden

  // Remove any existing analysis overlay
  const existingOverlay = document.getElementById(ANALYSIS_OVERLAY_ID);
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = ANALYSIS_OVERLAY_ID;
  // Basic styles (will be adjusted for error state)
  overlay.style.position = 'fixed';
  overlay.style.top = '20px';
  overlay.style.right = '20px';
  overlay.style.padding = '15px';
  overlay.style.backgroundColor = 'white';
  overlay.style.border = '1px solid #ccc';
  overlay.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.2)';
  overlay.style.zIndex = '9999';
  overlay.style.maxWidth = '300px';
  overlay.style.fontFamily = 'Arial, sans-serif';
  overlay.style.fontSize = '14px';
  overlay.style.color = '#333';

  let contentHtml = '';
  const isError = analysisData && analysisData.error === true;

  // Close button
  contentHtml += `<button id="truthBiasOverlayClose" style="position: absolute; top: 5px; right: 10px; background: transparent; border: none; font-size: 20px; cursor: pointer; padding: 5px;">&times;</button>`;

  if (isError) {
    overlay.style.borderColor = 'red';
    contentHtml += `<h3 style="margin-top: 0; margin-bottom: 10px; font-size: 18px; color: red;">Analysis Error</h3>`;
    contentHtml += `<p style="margin: 5px 0;">${analysisData.summary || 'An unknown error occurred.'}</p>`;
    if (analysisData.errorDetails) {
         contentHtml += `<p style="margin: 5px 0; font-size: 12px; color: #555;">Details: ${analysisData.errorDetails}</p>`;
    }
  } else if (!analysisData) {
    overlay.style.borderColor = 'red';
    contentHtml += `<h3 style="margin-top: 0; margin-bottom: 10px; font-size: 18px; color: red;">Analysis Unavailable</h3>`;
    contentHtml += `<p style="margin: 5px 0;">No analysis data was returned.</p>`;
  } else {
    contentHtml += `<h3 style="margin-top: 0; margin-bottom: 10px; font-size: 18px;">Page Analysis</h3>`;
    if (analysisData.truthfulness !== undefined) {
      contentHtml += `<p style="margin: 5px 0;">Truthfulness: ${analysisData.truthfulness}%</p>`;
    }
    if (analysisData.falsehood !== undefined) {
      contentHtml += `<p style="margin: 5px 0;">Falsehood: ${analysisData.falsehood}%</p>`;
    }

    if (analysisData.bias) {
      if (analysisData.bias.political) {
        contentHtml += `<h4 style="margin-top: 15px; margin-bottom: 5px;">Political Bias:</h4>
                        <ul style="list-style-type: none; padding-left: 10px; margin: 5px 0;">
                          <li>Left: ${analysisData.bias.political.left}%</li>
                          <li>Right: ${analysisData.bias.political.right}%</li>
                          <li>Neutral: ${analysisData.bias.political.neutral}%</li>
                        </ul>`;
      }
      if (analysisData.bias.social) {
        contentHtml += `<h4 style="margin-top: 15px; margin-bottom: 5px;">Social Bias:</h4>
                        <ul style="list-style-type: none; padding-left: 10px; margin: 5px 0;">
                          <li>Progressive: ${analysisData.bias.social.progressive}%</li>
                          <li>Conservative: ${analysisData.bias.social.conservative}%</li>
                          <li>Neutral: ${analysisData.bias.social.neutral}%</li>
                        </ul>`;
      }
    }
    if (analysisData.summary) {
        contentHtml += `<h4 style="margin-top: 15px; margin-bottom: 5px;">Summary:</h4><p style="margin:5px 0; font-size: 13px;">${analysisData.summary}</p>`;
    }
  }

  // Add status message at the bottom
  if (status) {
    contentHtml += `<p style="margin-top: 15px; font-size: 11px; color: #777; border-top: 1px solid #eee; padding-top: 5px;">Status: ${status}</p>`;
  }

  overlay.innerHTML = contentHtml;
  document.body.appendChild(overlay);

  document.getElementById('truthBiasOverlayClose').addEventListener('click', () => {
    overlay.remove();
  });
}

function extractPageText() {
  showLoadingIndicator(); // Show loading indicator before starting extraction & analysis

  let mainContent = document.querySelector('article, main');
  if (!mainContent) {
    mainContent = document.body;
  }

  const clonedContent = mainContent.cloneNode(true);

  const selectorsToRemove = 'script, style, nav, footer, aside, header, noscript, img, svg, video, audio, iframe, canvas, button, input, select, textarea, form, [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], [aria-hidden="true"]';
  clonedContent.querySelectorAll(selectorsToRemove).forEach(el => el.remove());

  const allElements = clonedContent.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const style = window.getComputedStyle(allElements[i]);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || style.height === '0px' || style.width === '0px') {
      allElements[i].remove();
    }
  }

  let text = clonedContent.innerText;
  text = text.replace(/\s\s+/g, ' ').trim();
  console.log("Extracted Page Text length:", text.length);

  chrome.runtime.sendMessage({ type: "TEXT_EXTRACTED", text: text }, function(response) {
    // hideLoadingIndicator(); // Moved to the beginning of displayAnalysisOverlay
    console.log("Response from background script:", response);
    if (response && response.analysis) {
      console.log("Received analysis from background:", response.analysis);
      displayAnalysisOverlay(response.analysis, response.status);
    } else {
      // Handle cases where response might be missing analysis or status
      const fallbackAnalysis = {
        error: true,
        summary: "Invalid response from background script.",
        errorDetails: response ? JSON.stringify(response).substring(0,100) : "No response object"
      };
      displayAnalysisOverlay(fallbackAnalysis, (response && response.status) || "Error: Invalid Response");
    }
  });

  return text;
}

// --- Text Highlighting and Annotation ---
let annotations = []; // Array to store annotation data (non-persistent for now)

document.addEventListener('mouseup', function(event) {
  if (event.target.closest && (event.target.closest(`#${ANALYSIS_OVERLAY_ID}`) || event.target.closest(`#${LOADING_OVERLAY_ID}`))) {
    return;
  }

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText && !selection.isCollapsed) {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
        console.log("Selection inside input/textarea/contentEditable, ignoring.");
        return;
    }

    const annotation = prompt(`Enter your thought for the selected text:\n\n"${selectedText}"`, "");

    if (annotation) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.className = 'thought-highlight';
      span.style.textDecoration = 'underline';
      span.style.backgroundColor = 'yellow';
      span.style.cursor = 'help';
      span.title = annotation;
      span.dataset.annotation = annotation;

      try {
        if (range.commonAncestorContainer.parentNode.closest('.thought-highlight')) {
            console.log("Selection is inside an existing highlight. Skipping to prevent nesting.");
            selection.removeAllRanges();
            return;
        }
        range.surroundContents(span);
        annotations.push({ range: range.cloneRange(), text: selectedText, annotation: annotation });
        console.log("Annotation added:", { selectedText, annotation });
      } catch (e) {
        console.error("Error surrounding contents: ", e);
        alert("Could not highlight this selection. It might span across complex HTML elements.");
      }
      selection.removeAllRanges();
    }
  }
});

// Call existing functions
extractPageText();
