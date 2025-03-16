import React, { useState } from "react";
import axios from "axios";

const BillScanner = () => {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImage(reader.result);
      };
    }
  };

  const handleScanBill = async () => {
    if (!image) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5001/api/process-bill", {
        base64Image: image.split(",")[1], // Remove base64 prefix
      });

      setResult(response.data);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to process the bill.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>📄 Scan Your Shopping Receipt</h2>

      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {image && <img src={image} alt="Uploaded bill" style={{ maxWidth: "100%", marginTop: "10px" }} />}

      <button onClick={handleScanBill} disabled={loading}>
        {loading ? "Scanning..." : "Scan Bill"}
      </button>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result">
          <h3>📊 Sustainability Analysis</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default BillScanner;
