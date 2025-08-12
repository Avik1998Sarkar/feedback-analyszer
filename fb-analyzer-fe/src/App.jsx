import { useState, useEffect, useRef } from "react";
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
    const [isListening, setIsListening] = useState(false);
    const [waveHeights, setWaveHeights] = useState([4, 4, 4]);
    const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

    // Reports modal state
    const [showReportsModal, setShowReportsModal] = useState(false);
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);

    const recognitionRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const rafRef = useRef(null);

    // Speech Recognition Setup
    useEffect(() => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event) => {
                let transcript = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                setFeedback(transcript);
            };

            recognition.onend = () => {
                stopAudioProcessing();
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            console.warn("Speech recognition is not supported.");
        }

        return () => {
            try {
                if (recognitionRef.current) {
                    recognitionRef.current.onresult = null;
                    recognitionRef.current.onend = null;
                    recognitionRef.current.abort && recognitionRef.current.abort();
                }
            } catch {}
            stopAudioProcessing();
        };
    }, []);

    // Audio waveform animation
    const startAudioProcessing = async () => {
        try {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;

            sourceRef.current.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const animateWave = () => {
                analyserRef.current.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
                const normalized = Math.min(avg / 5, 14);

                setWaveHeights([
                    Math.max(4, normalized),
                    Math.max(4, normalized * 0.6 + 2),
                    Math.max(4, normalized * 0.8 + 1)
                ]);

                rafRef.current = requestAnimationFrame(animateWave);
            };

            animateWave();
        } catch (err) {
            console.error("Mic access error:", err);
        }
    };

    const stopAudioProcessing = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }
        setWaveHeights([4, 4, 4]);
    };

    const handleMicClick = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            stopAudioProcessing();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            startAudioProcessing();
            setIsListening(true);
        }
    };

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

    const fetchReports = async () => {
        try {
            setLoadingReports(true);
            const res = await axios.get("http://localhost:8080/api/fb-analyser");
            setReports(res.data);
            setShowReportsModal(true);
        } catch (err) {
            console.error("Error fetching reports:", err);
            alert("Failed to load reports.");
        } finally {
            setLoadingReports(false);
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
            className="container-fluid min-vh-100 position-relative"
            style={{
                background: "linear-gradient(135deg, #5a8ec2ff, #ada594ff, #436485ff)",
                padding: "20px",
            }}
        >
            {/* Feedback Reports Button */}
            <button
                className="btn btn-warning position-absolute"
                style={{ top: "20px", right: "20px" }}
                onClick={fetchReports}
            >
                <i className="bi bi-table me-2"></i> Feedback Reports
            </button>

            {/* Reports Modal */}
            {showReportsModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">All Feedback Reports</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowReportsModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {loadingReports ? (
                                    <p>Loading reports...</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-hover">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Feedback Summary</th>
                                                    <th>Sentiment</th>
                                                    <th>Score</th>
                                                    <th>Customer Feedback</th>
                                                    <th>Based On</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reports.map((r, idx) => (
                                                    <tr key={idx}>
                                                        <td>{r.summary}</td>
                                                        <td
                                                            className={
                                                                r.sentiment_type?.toLowerCase() === "positive"
                                                                    ? "text-success fw-bold"
                                                                    : r.sentiment_type?.toLowerCase() === "negative"
                                                                    ? "text-danger fw-bold"
                                                                    : "text-warning fw-bold"
                                                            }
                                                        >
                                                            {r.sentiment_type}
                                                        </td>
                                                        <td>{r.score}</td>
                                                        <td>{r.customer_text}</td>
                                                        <td>{r.based_on}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowReportsModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Your existing feedback form */}
            <div className="row justify-content-center align-items-center min-vh-100">
                <div className="col-lg-6">
                    <div className="card p-4 shadow-sm">
                        <h3 className="text-center mb-4 fw-bold text-primary">
                            <i className="bi bi-chat-square-text-fill me-2"></i> Feedback Analyzer
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3 position-relative">
                                <label className="form-label fw-semibold">
                                    <i className="bi bi-pencil-square me-2"></i> Feedback
                                </label>
                                <textarea
                                    className="form-control pe-5"
                                    placeholder="Enter your feedback..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={4}
                                />
                                <button
                                    type="button"
                                    className={`mic-btn position-absolute ${isListening ? "bg-danger" : "bg-primary"}`}
                                    style={{ bottom: "10px", right: "10px", borderRadius: "50%", width: "40px", height: "40px", border: "none" }}
                                    onClick={handleMicClick}
                                    title={isListening ? "Stop Recording" : "Start Recording"}
                                >
                                    {isListening ? (
                                        <div style={{ display: "flex", gap: "2px" }}>
                                            {waveHeights.map((h, i) => (
                                                <span key={i} style={{ display: "block", width: "3px", height: `${h}px`, background: "white" }}></span>
                                            ))}
                                        </div>
                                    ) : (
                                        <i className="bi bi-mic-fill text-white"></i>
                                    )}
                                </button>
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
                                            style={{ maxHeight: isPreviewExpanded ? "480px" : "140px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
                                        />
                                        <div className="mt-2">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary me-2"
                                                onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                                            >
                                                {isPreviewExpanded ? "Collapse" : "Expand"}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => { setPreview(null); setFile(null); }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="d-grid">
                                <button
                                    className="btn btn-primary btn-lg fw-bold"
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

                    {loading && (
                        <div className="card mt-4 p-4 shadow-sm">
                            <div className="bg-light mb-3" style={{ height: "20px", width: "50%" }}></div>
                            <div className="bg-light mb-2" style={{ height: "15px", width: "80%" }}></div>
                            <div className="bg-light mb-2" style={{ height: "15px", width: "70%" }}></div>
                            <div className="bg-light" style={{ height: "15px", width: "90%" }}></div>
                        </div>
                    )}

                    {result && !loading && (
                        <div className="card mt-4 p-4 shadow-sm">
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
                            <p><strong>Summary:</strong> {result.summary}</p>
                            <p><strong>Sentiment:</strong> {result.sentiment_type}</p>
                            <p><strong>Score:</strong> {result.score}</p>
                            <p><strong>Based On:</strong> {result.based_on}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
