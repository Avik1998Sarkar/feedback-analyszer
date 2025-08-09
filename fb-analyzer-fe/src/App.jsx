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
    const [waveHeights, setWaveHeights] = useState([4, 4, 4]); // heights for bars

    const recognitionRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const rafRef = useRef(null);

    // Setup Speech Recognition
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
            alert("Speech recognition is not supported in this browser.");
        }
    }, []);

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
                const normalized = Math.min(avg / 5, 14); // scale for visual

                // Create variation for 3 bars
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
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setWaveHeights([4, 4, 4]); // reset bars
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
                background: "linear-gradient(135deg, #5a8ec2ff, #f8f9fa, #436485ff)",
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
          background: linear-gradient(90deg, #f1f3f5 25%, #e9ecef 50%, #f1f3f5 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        /* Mic Button Styles */
        .mic-btn {
          position: absolute;
          bottom: 10px;
          right: 10px;
          border: none;
          background-color: #0d6efd;
          color: white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 3px 6px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .mic-btn:hover {
          background-color: #0b5ed7;
          transform: scale(1.05);
        }
        .mic-btn.listening {
          background-color: #dc3545;
        }
        /* Live waveform bars */
        .waveform {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 2px;
          height: 16px;
        }
        .waveform span {
          display: block;
          width: 3px;
          background: white;
          border-radius: 2px;
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
                                    className={`mic-btn ${isListening ? "listening" : ""}`}
                                    onClick={handleMicClick}
                                    title={isListening ? "Stop Recording" : "Start Recording"}
                                >
                                    {isListening ? (
                                        <div className="waveform">
                                            <span style={{ height: `${waveHeights[0]}px` }}></span>
                                            <span style={{ height: `${waveHeights[1]}px` }}></span>
                                            <span style={{ height: `${waveHeights[2]}px` }}></span>
                                        </div>
                                    ) : (
                                        <i className="bi bi-mic-fill"></i>
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

                    {/* Loading Skeleton */}
                    {loading && (
                        <div className="card card-white mt-4 p-4">
                            <div className="skeleton mb-3" style={{ height: "20px", width: "50%" }}></div>
                            <div className="skeleton mb-2" style={{ height: "15px", width: "80%" }}></div>
                            <div className="skeleton mb-2" style={{ height: "15px", width: "70%" }}></div>
                            <div className="skeleton" style={{ height: "15px", width: "90%" }}></div>
                        </div>
                    )}

                    {/* Result Section */}
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
