import { useState } from "react";
import axios from "axios";

function App() {
  const [feedback, setFeedback] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!feedback.trim() && !file) {
      alert("Please enter feedback or upload an image.");
      return;
    }

    const formData = new FormData();
    formData.append("feedbackContent", feedback);
    if (file) {
      formData.append("file", file);
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:8080/api/fb-analyser", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to analyze feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", fontFamily: "Arial" }}>
      <h2>Feedback Analyzer</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Enter your feedback..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginBottom: "10px" }}
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "Submit"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc" }}>
          <h3>Analysis Result</h3>
          <p><strong>Summary:</strong> {result.summary}</p>
          <p><strong>Sentiment:</strong> {result.sentiment_type}</p>
          <p><strong>Score:</strong> {result.score}</p>
          <p><strong>Based On:</strong> {result.based_on}</p>
        </div>
      )}
    </div>
  );
}

export default App;
