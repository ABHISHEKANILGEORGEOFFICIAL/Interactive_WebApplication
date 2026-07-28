from base64 import b64decode
from io import BytesIO
import os
import uuid

import cv2
import numpy as np
from deepface import DeepFace
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image

app = Flask(__name__)
CORS(app)

# 🔥 create temp folder manually
TEMP_DIR = "temp_faces"

if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)


def decode_base64_image(data_url):
    payload = data_url.split(",", 1)[1] if "," in data_url else data_url
    raw_bytes = b64decode(payload)
    image = Image.open(BytesIO(raw_bytes)).convert("RGB")
    return np.array(image)


@app.post("/verify-face")
def verify_face():
    id_file = request.files.get("id_image")
    captured_images = request.form.getlist("captured_images")

    if not id_file or not captured_images:
        return jsonify({
            "success": False,
            "error": "Missing images"
        }), 400

    try:
        # 🔥 Save ID image
        id_image = np.array(Image.open(id_file).convert("RGB"))
        id_image = cv2.cvtColor(id_image, cv2.COLOR_RGB2BGR)

        id_path = os.path.join(
            TEMP_DIR,
            f"id_{uuid.uuid4().hex}.jpg"
        )

        cv2.imwrite(id_path, id_image)

        best_distance = 999
        valid_frames = 0

        for data_url in captured_images:
            try:
                captured_image = decode_base64_image(data_url)

                captured_image = cv2.cvtColor(
                    captured_image,
                    cv2.COLOR_RGB2BGR
                )

                live_path = os.path.join(
                    TEMP_DIR,
                    f"live_{uuid.uuid4().hex}.jpg"
                )

                cv2.imwrite(live_path, captured_image)

                # 🔥 REAL VERIFICATION
                result = DeepFace.verify(
                    img1_path=id_path,
                    img2_path=live_path,
                    model_name="Facenet512",
                    detector_backend="opencv",
                    enforce_detection=False
                )

                distance = float(result["distance"])

                print("RESULT:", result)
                print("DISTANCE:", distance)

                valid_frames += 1

                if distance < best_distance:
                    best_distance = distance

                # cleanup frame
                if os.path.exists(live_path):
                    os.remove(live_path)

            except Exception as frame_error:
                print("Skipped frame:", frame_error)
                continue

        # cleanup ID
        if os.path.exists(id_path):
            os.remove(id_path)

        if valid_frames == 0:
            return jsonify({
                "success": False,
                "error": "No valid face detected"
            })

        confidence = round((1 - best_distance) * 100, 2)

        # 🔥 relaxed threshold
        match = best_distance < 0.45

        print("BEST DISTANCE:", best_distance)

        return jsonify({
            "success": bool(match),
            "confidence": confidence,
            "distance": best_distance
        })

    except Exception as e:
        print("Verification error:", str(e))

        return jsonify({
            "success": False,
            "error": "Verification failed"
        }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)