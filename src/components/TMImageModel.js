import React, { useRef, useEffect, useState } from "react";
import * as tmImage from "@teachablemachine/image";

const TMImageModel = () => {
  const webcamRef = useRef(null);
  const modelRef = useRef(null);
  const webcamInstanceRef = useRef(null);
  const [predictions, setPredictions] = useState([]);

  const URL = process.env.PUBLIC_URL + "/tm-my-image-model/";
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  useEffect(() => {
    const init = async () => {
      // Load model
      const model = await tmImage.load(modelURL, metadataURL);
      modelRef.current = model;

      const maxPredictions = model.getTotalClasses();

      // Setup webcam
      const webcam = new tmImage.Webcam(200, 200, true);
      await webcam.setup();
      await webcam.play(); // ✅ This is where error occurred if webcam is undefined
      webcamRef.current.appendChild(webcam.canvas);
      webcamInstanceRef.current = webcam;

      // Start prediction loop
      const loop = async () => {
        webcam.update();
        const prediction = await model.predict(webcam.canvas);
        setPredictions(prediction);
        requestAnimationFrame(loop);
      };

      loop();
    };

    init();
  }, []);

  return (
    <div>
      <h2>Teachable Machine Image Model</h2>
      <div ref={webcamRef} id="webcam-container" />
      <div id="label-container">
        {predictions.map((pred, index) => (
          <div key={index}>
            {pred.className}: {(pred.probability * 100).toFixed(2)}%
          </div>
        ))}
      </div>
    </div>
  );
};

export default TMImageModel;
