// FaceVerification.jsx

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import sahabg2 from "../assets/sahabg2.mp4";
import logo from "/logo.png";

const SIGNUP_DRAFT_KEY = "signup_form_draft_v1";

const FACE_VERIFY_URL =
  import.meta.env.VITE_FACE_VERIFY_URL ||
  "http://127.0.0.1:5000/verify-face";

export default function FaceVerification() {
  const navigate = useNavigate();
  const location = useLocation();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [idCardFile, setIdCardFile] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confidence, setConfidence] = useState(null);
  const [error, setError] = useState("");

  const signupDraft = location.state?.signupDraft
    ? location.state.signupDraft
    : (() => {
        try {
          const saved = localStorage.getItem(SIGNUP_DRAFT_KEY);
          return saved ? JSON.parse(saved) : null;
        } catch {
          return null;
        }
      })();

  // =========================
  // START CAMERA
  // =========================
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: "user",
          },
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error(err);
        setError("Please allow camera access.");
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  // =========================
  // SELECT ID CARD
  // =========================
  const onSelectIdCard = (e) => {
    setIdCardFile(e.target.files?.[0] || null);
    setVerificationResult(null);
    setConfidence(null);
    setError("");
  };

  // =========================
  // CAPTURE FRAMES
  // =========================
  const captureFrames = async () => {
    const frames = [];

    if (!videoRef.current || !canvasRef.current) {
      return frames;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = 320;
    canvas.height = 240;

    const ctx = canvas.getContext("2d");

    for (let i = 0; i < 6; i++) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const image = canvas.toDataURL(
        "image/jpeg",
        0.6
      );

      frames.push(image);

      await new Promise((resolve) =>
        setTimeout(resolve, 120)
      );
    }

    return frames;
  };

  // =========================
  // VERIFY FACE
  // =========================
  const verifyFace = async () => {
    if (!idCardFile) {
      setError("Please upload your ID card.");
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    setError("");

    try {
      const frames = await captureFrames();

      const formData = new FormData();

      formData.append("id_image", idCardFile);

      frames.forEach((frame) => {
        formData.append("captured_images", frame);
      });

      const response = await fetch(FACE_VERIFY_URL, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();

      let data = {};

      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      console.log("Verification response:", data);

      setConfidence(data?.confidence || 0);

      if (response.ok && data?.success) {
        setVerificationResult(true);
      } else {
        setVerificationResult(false);
        setError(
          data?.error ||
            data?.message ||
            "Face verification failed."
        );
      }
    } catch (err) {
      console.error(err);

      setVerificationResult(false);
      setError("Verification server error.");
    } finally {
      setIsVerifying(false);
    }
  };

  // =========================
  // CONTINUE SIGNUP
  // =========================
  const goNext = () => {
    if (!verificationResult) {
      setError(
        "Please complete face verification first."
      );
      return;
    }

    if (!signupDraft?.form) {
      setError("Signup details are missing. Please restart signup.");
      return;
    }

    const nextDraft = {
      ...signupDraft,
      step: 4,
      faceVerified: true,
    };

    localStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(nextDraft));
    navigate("/signup", { state: { signupDraft: nextDraft } });
  };

  // =========================
  // BACK BUTTON
  // =========================
  const goBack = () => {
    navigate("/signup", {
      state: {
        signupDraft: {
          ...signupDraft,
          step: 4,
        },
      },
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover"
      >
        <source
          src={sahabg2}
          type="video/mp4"
        />
      </video>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-8 text-white">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={logo}
            alt="logo"
            className="w-16 h-16 mb-3"
          />

          <h1 className="text-5xl font-bold text-center">
            Live Face Verification
          </h1>

          <p className="text-sm text-white/80 mt-4 text-center">
            Upload your ID card and look straight
            into the camera.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left */}
          <div>
            <label className="block mb-3 text-2xl font-semibold">
              Upload ID Card
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={onSelectIdCard}
              className="w-full rounded-xl border border-white/20 bg-white text-black p-4"
            />

            <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5 text-lg space-y-2">
              <p>
                • Look straight at the camera
              </p>
              <p>
                • Keep face centered
              </p>
              <p>
                • Avoid heavy shadows
              </p>
              <p>
                • Remove extreme face tilt
              </p>
            </div>
          </div>

          {/* Right */}
          <div>
            <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-80 object-cover"
              />

              {isVerifying && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />

                  <p className="text-white font-semibold text-xl">
                    Analyzing live video...
                  </p>
                </div>
              )}
            </div>

            <canvas
              ref={canvasRef}
              className="hidden"
            />

            {/* Verify Button */}
            <div className="mt-5">
              <button
                onClick={verifyFace}
                disabled={isVerifying}
                className="w-full py-5 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition text-2xl"
              >
                {isVerifying
                  ? "Verifying..."
                  : "Start Live Verification"}
              </button>
            </div>
          </div>
        </div>

        {/* Confidence */}
        {confidence !== null && (
          <div className="mt-8">
            <div className="flex justify-between mb-2 text-lg">
              <span>Confidence</span>

              <span>
                {confidence.toFixed(1)}%
              </span>
            </div>

            <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    confidence,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Success */}
        {verificationResult === true && (
          <div className="mt-7 p-5 rounded-xl bg-green-500/20 border border-green-400 text-green-200 text-center font-semibold text-2xl">
            Verified Successfully ✅
          </div>
        )}

        {/* Failed */}
        {verificationResult === false && (
          <div className="mt-7 p-5 rounded-xl bg-red-500/20 border border-red-400 text-red-200 text-center font-semibold text-2xl">
            Not Verified ❌
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 text-center text-red-300 text-lg whitespace-pre-line">
            {error}
          </div>
        )}

        {/* Bottom Buttons */}
        <div className="mt-8 flex justify-between items-center">
          {/* Back */}
          <button
            onClick={goBack}
            className="px-8 py-4 rounded-xl border border-white/30 text-white font-semibold transition hover:bg-white/10 text-xl"
          >
            Back
          </button>

          {/* Continue */}
          <button
            onClick={goNext}
            disabled={!verificationResult}
            className={`px-10 py-4 rounded-xl font-semibold transition text-xl ${
              verificationResult
                ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                : "bg-gray-500 cursor-not-allowed text-white"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}