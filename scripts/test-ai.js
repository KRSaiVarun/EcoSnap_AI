import fetch from "node-fetch";

async function testAI() {
  try {
    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "I'm thinking of driving to work today, about 10km each way",
        preferences: {
          location: "San Francisco",
          lifestyle: "urban",
          budget: "moderate",
        },
      }),
    });

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testAI();
