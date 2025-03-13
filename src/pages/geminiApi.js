export const processImage = async (base64Image) => {
    try {
      const response = await fetch("http://localhost:5000/process-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image }),
      });
  
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "No response received.";
    } catch (error) {
      console.error("Error calling proxy server:", error);
      return "Error processing image.";
    }
  };
  