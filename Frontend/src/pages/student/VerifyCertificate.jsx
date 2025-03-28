import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import logo from "../../assets/SNS-DT Logo.png";
import { FaCheckCircle } from 'react-icons/fa'; // Importing a tick icon from react-icons

const VerifyCertificate = () => {
    const { uniqueId, finishdate, userscore } = useParams();
    const [certificateData, setCertificateData] = useState(null);
    const [error, setError] = useState("");
    const canvasRef = useRef(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    useEffect(() => {
        const fetchCertificate = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/mcq/verify-certificate/${uniqueId}/`);

                if (response.data.status === "success") {
                    const certData = response.data.certificate;
                    let formattedDate = finishdate ? decodeURIComponent(finishdate).replace(/-/g, " ") : "Unknown Date";
                    let correctAnswers = userscore ? parseInt(userscore, 10) : 0;

                    setCertificateData({
                        ...certData,
                        testDate: formattedDate,
                        correctAnswers
                    });
                } else {
                    setError("Certificate not found.");
                }
            } catch (err) {
                console.error("Error fetching certificate:", err);
                setError("Failed to fetch certificate. Please try again.");
            }
        };
        fetchCertificate();
    }, [uniqueId, finishdate, userscore]);

    useEffect(() => {
        if (certificateData) {
            drawCertificate();
        }
    }, [certificateData]);

    const drawCertificate = () => {
        if (!certificateData) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.src = "/cert_template_temp.png";

        const text = `For successfully completing ${certificateData.contestName} on ${certificateData.testDate},
achieving an outstanding score of ${certificateData.correctAnswers}.This recognition is awarded
 in honor of exemplary performance, dedication, and commitment 
 to excellence in the assessment.`;

img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    ctx.font = "34px Helvetica";
    ctx.textAlign = "center";
    ctx.fillStyle = "#333"; // Darker text color
    ctx.fillText(certificateData.studentName, canvas.width / 2, 300);

    ctx.font = "16px Helvetica";
    ctx.textAlign = "left"; // Align text to left
    const lines = text.split("\n"); // Split text into separate lines
    
    lines.forEach((line, index) => {
        ctx.fillText(line, 100, 360 + index * 30); // Render each line separately
    });

    ctx.font = "10px Helvetica";
    ctx.fillText(`${certificateData.uniqueId}`, canvas.width / 4.4, 590);
};

    };
    return (
        <div className="certificate-container">
            <div className="header">
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">
                    <img src={logo} alt="Logo" className="logo" />
                </a>
                <h1 className="certificate-title">Certificate Verification Gate</h1>
            </div>
            {error && <p className="error-message">{error}</p>}
            {certificateData && (
                <div className="certificate-report">
                    <div className="certificate-image">
                        <canvas ref={canvasRef} width={800} height={600}></canvas>
                    </div>
                    <div className="certificate-details">
                        <div className="tick-mark">
                            <FaCheckCircle size={90} color="#4CAF50" /> {/* Tick mark icon */}
                        </div>
                        <div className="certificate-info">
                            <strong>Certificate Status: </strong> {"Valid"}
                        </div>
                        <div className="certificate-info">
                            <strong>Test Name:</strong> {certificateData.contestName}
                        </div>
                        <div className="certificate-info">
                            <strong>Learner Name:</strong> {certificateData.studentName}
                        </div>
                        <div className="certificate-info">
                            <strong>Completion Date:</strong> {certificateData.testDate}
                        </div>
                        <div className="certificate-info">
                            <strong>Generate Date:</strong> {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>
            )}
            <style jsx>{`
                .certificate-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    background-color: #f9f9f9;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }

                .header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .logo {
                    width: 190px;
                    height: 100px;
                    margin-right: 10px;
                }

                .certificate-title {
                    margin-left: 230px;
                    font-weight: bold;
                    font-size: 24px;
                    color: #333;
                }

                .error-message {
                    color: red;
                    text-align: center;
                    margin-bottom: 20px;
                }

                .certificate-report {
                    display: flex;
                    align-items: flex-start;
                    border: 1px solid #ddd;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    background-color: #fff;
                }

                .certificate-image {
                    margin-right: 20px;
                }

                .certificate-image canvas {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                }

                .certificate-details {
                    flex: 1;
                    margin-top: 190px;
                    position: relative;
                }

                .tick-mark {
                    position: absolute;
                    top: -120px;
                    right: 50px;
                    left: 105px;
                }

                .certificate-info {
                    margin-bottom: 10px;
                    color: #555;
                }

                .certificate-info strong {
                    margin-right: 10px;
                    color: #333;
                }
            `}</style>
        </div>
    );
};

export default VerifyCertificate;
 