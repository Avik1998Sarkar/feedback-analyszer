import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function App() {
    const [feedback, setFeedback] = useState("");
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showResult, setShowResult] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        if (selectedFile) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedback.trim() && !file) {
            alert("Please enter feedback or upload an image.");
            return;
        }

        const formData = new FormData();
        formData.append("feedbackContent", feedback);
        if (file) formData.append("file", file);

        try {
            setLoading(true);
            setShowResult(false);
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

    useEffect(() => {
        if (result) {
            const timer = setTimeout(() => setShowResult(true), 50);
            return () => clearTimeout(timer);
        }
    }, [result]);

    return (
        <div
            className="container-fluid min-vh-100 d-flex align-items-center justify-content-center"
            style={{
                background: "linear-gradient(135deg, #3183d4ff, #cccecfff, #3183d4ff)",
                padding: "20px",
            }}
        >
            <style>{`
        .card-white {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #dee2e6;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          animation: dropIn 0.8s ease forwards;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .btn-accent {
          background-color: #0d6efd;
          border: none;
          transition: all 0.3s ease;
        }
        .btn-accent:hover {
          background-color: #0b5ed7;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
        }
        .preview-img {
          animation: fadeIn 0.5s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .skeleton {
          background: linear-gradient(90deg, #76828dff 25%, #e9ecef 50%, #f1f3f5 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

            <div className="row justify-content-center w-100">
                <div className="col-lg-6">
                    {/* Feedback Form Card */}
                    <div className="card card-white p-4">
                        <h3 className="text-center mb-4 fw-bold text-primary">
                            <i className="bi bi-chat-square-text-fill me-2"></i>
                            Feedback Analyzer
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label fw-semibold">
                                    <i className="bi bi-pencil-square me-2"></i> Feedback
                                </label>
                                <textarea
                                    className="form-control"
                                    placeholder="Enter your feedback..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={4}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-semibold">
                                    <i className="bi bi-image-fill me-2"></i> Upload Image (optional)
                                </label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                {preview && (
                                    <div className="mt-3 text-center">
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="img-fluid rounded preview-img"
                                            style={{ maxHeight: "200px" }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="d-grid">
                                <button
                                    className="btn btn-accent btn-lg fw-bold text-white"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-send-fill me-2"></i> Submit Feedback
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Result Section */}
                    {loading && (
                        <div className="card card-white mt-4 p-4">
                            <div className="skeleton mb-3" style={{ height: "20px", width: "50%" }}></div>
                            <div className="skeleton mb-2" style={{ height: "15px", width: "80%" }}></div>
                            <div className="skeleton mb-2" style={{ height: "15px", width: "70%" }}></div>
                            <div className="skeleton" style={{ height: "15px", width: "90%" }}></div>
                        </div>
                    )}

                    {result && !loading && (
                        <div
                            className={`card card-white mt-4 p-4 ${showResult ? "show" : ""}`}
                            style={{ animation: "dropIn 0.8s ease" }}
                        >
                            <h4
                                className={`fw-bold mb-3 ${result.sentiment_type?.toLowerCase() === "positive"
                                        ? "text-success"
                                        : result.sentiment_type?.toLowerCase() === "negative"
                                            ? "text-danger"
                                            : "text-warning"
                                    }`}
                            >
                                <i className="bi bi-bar-chart-fill me-2"></i> Analysis Result
                            </h4>
                            <hr />
                            <p>
                                <strong><i className="bi bi-journal-text me-2"></i> Summary:</strong> {result.summary}
                            </p>
                            <p>
                                <strong><i className="bi bi-emoji-smile me-2"></i> Sentiment:</strong> {result.sentiment_type}
                            </p>
                            <p>
                                <strong><i className="bi bi-graph-up me-2"></i> Score:</strong> {result.score}
                            </p>
                            <p>
                                <strong><i className="bi bi-info-circle me-2"></i> Based On:</strong> {result.based_on}
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default App;
