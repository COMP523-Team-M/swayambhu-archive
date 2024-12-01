// utils/openaiQueryAnalysis.js

const analyzeQuery = async (query) => {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: `Analyze the user's query: "${query}"` }
          ],
          max_tokens: 50,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        const text = data.choices[0].message.content.trim();
        return {
          type: "video-level", 
          keywords: text.split(" "),
        };
      } else {
        console.error("Error from OpenAI API:", data);
        throw new Error(data.error?.message || "Failed to analyze query");
      }
    } catch (error) {
      console.error("Error in analyzeQuery:", error);
      throw new Error("Failed to analyze query");
    }
  };
  
  export { analyzeQuery };
  