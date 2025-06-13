// Define mock data for fallback
const fallbackMockAnalysis = {
  truthfulness: 0,
  falsehood: 0,
  bias: {
    political: { left: 0, right: 0, neutral: 100 },
    social: { progressive: 0, conservative: 0, neutral: 100 }
  },
  summary: "Mock analysis due to API error or missing key.",
  error: true // Custom flag to indicate this is a fallback
};

async function analyzeTextWithOpenAI(text) {
  console.log("analyzeTextWithOpenAI: Attempting to analyze text of length:", text.length);

  let apiKey;
  try {
    const data = await chrome.storage.local.get('openaiApiKey');
    if (data && data.openaiApiKey) {
      apiKey = data.openaiApiKey;
    }
  } catch (e) {
    console.error("Error retrieving API key from chrome.storage.local:", e);
    return { ...fallbackMockAnalysis, summary: "Error retrieving API key.", errorDetails: e.message };
  }

  if (!apiKey) {
    console.error("OpenAI API key not found in storage. Please set it in the extension options.");
    return { ...fallbackMockAnalysis, summary: "OpenAI API key not found. Please set it in the extension options." };
  }

  const apiEndpoint = "https://api.openai.com/v1/chat/completions";
  const promptSystem = "You are an AI assistant that analyzes text for truthfulness, falsehood, and political/social bias. Respond ONLY with a valid JSON object adhering to the specified structure. Do not include any explanatory text outside of the JSON structure. If a value cannot be determined, use 0 or a neutral default, but ensure the schema is complete.";

  const promptUser = `
Given the following text, provide an analysis in JSON format with the exact following structure:
{
  "truthfulness": PERCENTAGE_NUMBER,
  "falsehood": PERCENTAGE_NUMBER,
  "bias": {
    "political": { "left": PERCENTAGE_NUMBER, "right": PERCENTAGE_NUMBER, "neutral": PERCENTAGE_NUMBER },
    "social": { "progressive": PERCENTAGE_NUMBER, "conservative": PERCENTAGE_NUMBER, "neutral": PERCENTAGE_NUMBER }
  },
  "summary": "A brief explanation of your reasoning for the percentages. Max 1-2 sentences."
}
Ensure the sum of left, right, neutral for political bias is 100.
Ensure the sum of progressive, conservative, neutral for social bias is 100.
Analyze the following text:
---
${text}
---
`;

  const payload = {
    model: "gpt-3.5-turbo-0125", // Updated model that supports JSON mode well
    messages: [
      { "role": "system", "content": promptSystem },
      { "role": "user", "content": promptUser }
    ],
    temperature: 0.3,
    response_format: { "type": "json_object" }
  };

  try {
    console.log("Sending request to OpenAI API...");
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text(); // Read error body for more details
      console.error("OpenAI API Error:", response.status, response.statusText, errorBody);
      return { ...fallbackMockAnalysis, summary: `API request failed: ${response.status} ${response.statusText}`, errorDetails: errorBody };
    }

    const data = await response.json();
    console.log("Received response from OpenAI API:", data);

    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      const messageContent = data.choices[0].message.content;
      try {
        // The response should be a JSON string, parse it
        const analysisResult = JSON.parse(messageContent);
        console.log("Successfully parsed analysis from OpenAI:", analysisResult);
        // Basic validation of structure (can be more thorough)
        if (analysisResult.truthfulness !== undefined && analysisResult.bias && analysisResult.bias.political) {
           return analysisResult;
        } else {
           console.error("Parsed JSON from OpenAI does not match expected structure:", analysisResult);
           return { ...fallbackMockAnalysis, summary: "API returned data in an unexpected structure.", errorDetails: JSON.stringify(analysisResult) };
        }
      } catch (e) {
        console.error("Error parsing JSON from OpenAI response content:", e, "\nContent was:", messageContent);
        return { ...fallbackMockAnalysis, summary: "Could not parse analysis data from API response.", errorDetails: e.message };
      }
    } else {
      console.error("Invalid response structure from OpenAI:", data);
      return { ...fallbackMockAnalysis, summary: "API returned an invalid response structure.", errorDetails: JSON.stringify(data) };
    }

  } catch (e) {
    console.error("Network or other error during OpenAI API call:", e);
    return { ...fallbackMockAnalysis, summary: "Network error or other issue during API call.", errorDetails: e.message };
  }
}

// Make the listener async to use await
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log("Message received in background script:", request);
  if (request.type === "TEXT_EXTRACTED") {
    console.log("Background script received text length:", request.text.length);

    const analysisResult = await analyzeTextWithOpenAI(request.text);

    if (analysisResult.error) {
        sendResponse({ status: "API Error", message: analysisResult.summary, analysis: analysisResult });
    } else {
        sendResponse({ status: "Analysis complete (Live API)", analysis: analysisResult });
    }
    // No explicit 'return true;' needed for async listeners if sendResponse is called on all paths of the promise.
    // However, if there were paths where sendResponse wasn't called, it might be needed.
    // For clarity or if logic becomes more complex, it can be kept.
    // For now, it's implicitly handled by returning a promise.
  }
  // If other message types were handled that are synchronous, returning true might be needed there.
  // For this single async handler, it's fine.
  return true; // Still good practice for clarity and future message types.
});
