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
        <h3
          className={`tm-status ${
            majorityClass === "Class 1" ? "blue" : "red"
          }`}
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
