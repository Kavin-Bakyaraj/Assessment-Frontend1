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