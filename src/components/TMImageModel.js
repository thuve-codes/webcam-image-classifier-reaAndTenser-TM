import React, { useRef, useState, useEffect } from "react";
import * as tmImage from "@teachablemachine/image";

const TMImageModel = () => {
  const webcamRef = useRef(null);
  const modelRef = useRef(null);
  const audio = useRef(null);
  const currentlyPlaying = useRef(null);

  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [majorityClass, setMajorityClass] = useState(null);

  const URL = process.env.PUBLIC_URL + "/tm-my-image-model/";
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  useEffect(() => {
    const interval = setInterval(() => {
      if (predictions.length > 0) {
        sendPredictionsToBackend(predictions);
      }
    }, 1000); // Send data every second

    return () => clearInterval(interval);
  }, [predictions]);

  const sendPredictionsToBackend = async (data) => {
    try {
      await fetch("http://localhost:5000/api/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ observations: data }),
      });
    } catch (error) {
      console.error("Error sending predictions to backend:", error);
    }
  };

  const stopAudio = (audio) => {
    if (audio && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const playAudio = (audio) => {
    if (!audio) return;
    audio.play().catch((err) => {
      console.warn("Audio play error:", err);
    });
  };

  const init = async () => {
    setLoading(true);
    try {
      // Load audios
      audio.current = new Audio("/audio/champak.mp3");
      audio.current = new Audio("/audio/jawan.mp3");

      // Allow user gesture to enable autoplay
      audio.current.load();
      audio.current.load();

      audio.current.loop = true;
      audio.current.loop = true;

      const model = await tmImage.load(modelURL, metadataURL);
      modelRef.current = model;

      const webcam = new tmImage.Webcam(200, 200, true);
      await webcam.setup();
      await webcam.play();

      webcamRef.current.innerHTML = "";
      webcamRef.current.appendChild(webcam.canvas);

      setLoading(false);

      const loop = async () => {
        webcam.update();
        const newPredictions = await model.predict(webcam.canvas);
        const timestamp = new Date().toISOString();

        // Only keep predictions where class has > 50% confidence
        const confidentPredictions = newPredictions
          .filter((p) => p.probability > 0.5)
          .map((p) => ({
            className: p.className,
            probability: p.probability,
            timestamp,
          }));

        if (confidentPredictions.length > 0) {
          setPredictions((prev) => {
            const now = Date.now();
            const oneMinuteAgo = now - 60000;
            const recentPredictions = [...prev, ...confidentPredictions].filter(
              (p) => new Date(p.timestamp).getTime() >= oneMinuteAgo
            );
            return recentPredictions;
          });
        }

        const topPrediction = newPredictions.reduce((max, p) =>
          p.probability > max.probability ? p : max
        );

        const label = topPrediction.className;

        if (label !== majorityClass) {
          setMajorityClass(label);

          switch (label) {
            case "cow":
              if (currentlyPlaying.current !== "cow") {
                stopAudio(audio.current);
                playAudio(audio.current);
                currentlyPlaying.current = "cow";
              }
              break;

            case "eleplant":
              if (currentlyPlaying.current !== "eleplant") {
                stopAudio(audio.current);
                playAudio(audio.current);
                currentlyPlaying.current = "eleplant";
              }
              break;

            case "Class 4":
              if (currentlyPlaying.current !== "eleplant") {
                stopAudio(audio.current);
                playAudio(audio.current);
                currentlyPlaying.current = "eleplant";
              }
              break;

            default:
              stopAudio(audio.current);
              stopAudio(audio.current);
              currentlyPlaying.current = null;
          }
        }

        requestAnimationFrame(loop);
      };

      loop();
    } catch (error) {
      console.error("Initialization error:", error);
      setLoading(false);
    }
  };

  const handleStart = () => {
    setStarted(true);
    init();
  };

  const renderStatusText = () => {
    switch (majorityClass) {
      case "cow":
        return "Detected: Cow";
      case "eleplant":
        return "Detected: Elephant";
      case "other":
        return "Detected: Other Object";
      case "Class 4":
        return "Detected: Both";
      default:
        return "Detecting...";
    }
  };

  return (
    <div className="tm-container">
      <h2 className="tm-title">Teachable Machine Image Model</h2>

      {!started && (
        <button className="tm-start-button" onClick={handleStart}>
          Start Detection
        </button>
      )}

      {loading && <p style={{ fontSize: 16 }}>Loading model and webcam...</p>}

      <div ref={webcamRef} className="tm-webcam" />

      {majorityClass && !loading && (
        <h3 className="tm-status">
          <span>{renderStatusText()}</span>
        </h3>
      )}
    </div>
  );
};

export default TMImageModel;
