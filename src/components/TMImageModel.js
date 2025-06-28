import React, { useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";

const TMImageModel = () => {
  const webcamRef = useRef(null);
  const modelRef = useRef(null);
  const audioClass1 = useRef(null);
  const audioClass2 = useRef(null);
  const currentlyPlaying = useRef(null);

  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [majorityClass, setMajorityClass] = useState(null);

  const URL = process.env.PUBLIC_URL + "/tm-my-image-model/";
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

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
      audioClass1.current = new Audio("/audio/champak.mp3");
      audioClass2.current = new Audio("/audio/jawan.mp3");

      audioClass1.current.loop = true;
      audioClass2.current.loop = true;

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
        const predictions = await model.predict(webcam.canvas);

        const topPrediction = predictions.reduce((max, p) =>
          p.probability > max.probability ? p : max
        );

        if (topPrediction.className !== majorityClass) {
          setMajorityClass(topPrediction.className);

          // Stop currently playing audio if different
          if (topPrediction.className === "Class 1") {
            if (currentlyPlaying.current !== "Class 1") {
              stopAudio(audioClass2.current);
              playAudio(audioClass1.current);
              currentlyPlaying.current = "Class 1";
            }
          } else if (topPrediction.className === "Class 2") {
            if (currentlyPlaying.current !== "Class 2") {
              stopAudio(audioClass1.current);
              playAudio(audioClass2.current);
              currentlyPlaying.current = "Class 2";
            }
          } else {
            // Unknown class: stop all audio
            stopAudio(audioClass1.current);
            stopAudio(audioClass2.current);
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

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "20px auto",
        textAlign: "center",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#222",
        padding: 20,
        borderRadius: 8,
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h2 style={{ marginBottom: 20 }}>Teachable Machine Image Model</h2>

      {!started && (
        <button
          onClick={handleStart}
          style={{
            padding: "12px 30px",
            fontSize: 18,
            borderRadius: 6,
            cursor: "pointer",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            boxShadow: "0 3px 8px rgba(76, 175, 80, 0.5)",
            transition: "background-color 0.3s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#45a045")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#4caf50")
          }
        >
          Start Detection
        </button>
      )}

      {loading && <p style={{ fontSize: 16 }}>Loading model and webcam...</p>}

      <div
        ref={webcamRef}
        style={{
          margin: "20px auto",
          width: 220,
          height: 220,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          border: "2px solid #ccc",
          backgroundColor: "#000",
        }}
      />

      {majorityClass && !loading && (
        <h3
          style={{
            marginTop: 20,
            fontWeight: "bold",
            fontSize: 20,
            color: majorityClass === "Class 1" ? "#1976d2" : "#d32f2f",
          }}
        >
          User is{" "}
          <span>
            {majorityClass === "Class 1"
              ? "not holding a mobile"
              : majorityClass === "Class 2"
              ? "holding a mobile"
              : "unknown"}
          </span>
        </h3>
      )}
    </div>
  );
};

export default TMImageModel;
