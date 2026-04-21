"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Camera, RefreshCw, CheckCircle2 } from "lucide-react";
import MessagingSidebar from "./MessagingSidebar";

/**
 * CHALLENGE: SCAN ENHANCEMENT
 * * Your goal is to improve the User Experience of the Scanning Flow.
 * 1. Implement a Visual Guidance Overlay (e.g., a circle or mouth outline) on the video feed.
 * 2. Add real-time feedback to the user (e.g., "Face not centered", "Move closer").
 * 3. Ensure the UI feels premium and responsive.
 */

export default function ScanningFlow() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const feedbackTextRef = useRef<HTMLDivElement>(null);
  const [camReady, setCamReady] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const VIEWS = [
    { label: "Front View", instruction: "Smile and look straight at the camera." },
    { label: "Left View", instruction: "Turn your head to the left." },
    { label: "Right View", instruction: "Turn your head to the right." },
    { label: "Upper Teeth", instruction: "Tilt your head back and open wide." },
    { label: "Lower Teeth", instruction: "Tilt your head down and open wide." },
  ];

  // Initialize Camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCamReady(true);
        }
      } catch (err) {
        console.error("Camera access denied", err);
      }
    }
    startCamera();
  }, []);

  // Simulated ML Guardrail State (Performance Optimized)
  useEffect(() => {
    if (!camReady || currentStep >= 5) return;

    const stabilityStates = [
      { borderColor: 'border-red-500', text: 'Hold still or move closer', textColor: 'text-red-400' },
      { borderColor: 'border-yellow-500', text: 'Adjusting position...', textColor: 'text-yellow-400' },
      { borderColor: 'border-green-500', text: 'Perfect! Hold steady.', textColor: 'text-green-400' }
    ];

    let tick = 0;
    // Simulating a high-frequency frame analysis loop
    const interval = setInterval(() => {
      if (!overlayRef.current || !feedbackTextRef.current) return;
      
      const state = stabilityStates[tick % stabilityStates.length];
      
      // Dynamic Shape Logic: Wider for upper/lower teeth (Steps 3 & 4)
      const isWideView = currentStep === 3 || currentStep === 4;
      const baseShape = isWideView ? 'w-72 h-56 rounded-[40%]' : 'w-56 h-72 rounded-[50%]';

      // Direct DOM mutation avoids React re-renders, saving media feed performance
      overlayRef.current.className = `absolute m-auto inset-0 ${baseShape} border-4 border-dashed transition-all duration-300 pointer-events-none ${state.borderColor}`;
      
      feedbackTextRef.current.innerText = state.text;
      feedbackTextRef.current.className = `absolute top-8 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-sm font-semibold shadow-lg transition-colors duration-300 ${state.textColor}`;

      tick++;
    }, 1500); // Cycles every 1.5s for demo purposes

    return () => clearInterval(interval);
  }, [camReady, currentStep]);

  const handleCapture = useCallback(() => {
    // Boilerplate logic for capturing a frame from the video feed
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImages((prev) => [...prev, dataUrl]);
      setCurrentStep((prev) => prev + 1);
    }
  }, []);

  // Trigger Backend Notification on Completion
  useEffect(() => {
    if (currentStep === 5) {
      const triggerNotification = async () => {
        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scanId: `scan_${Math.random().toString(36).substring(7)}`,
              status: 'completed',
              userId: 'user_123'
            })
          });
          console.log("Notification payload sent.");
        } catch (e) {
          console.error("Failed to notify server", e);
        }
      };
      triggerNotification();
    }
  }, [currentStep]);

  return (
    <div className="flex flex-col items-center bg-black min-h-screen text-white">
      {/* Header */}
      <div className="p-4 w-full bg-zinc-900 border-b border-zinc-800 flex justify-between">
        <h1 className="font-bold text-blue-400">DentalScan AI</h1>
        <span className="text-xs text-zinc-500">Step {currentStep + 1}/5</span>
      </div>

      {/* Main Viewport */}
      <div className="relative w-full max-w-md aspect-[3/4] bg-zinc-950 overflow-hidden flex items-center justify-center">
        {currentStep < 5 ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover grayscale opacity-80" 
            />
            
            {/* Optimized Guidance Overlay */}
            <div 
              ref={overlayRef} 
              className="absolute m-auto inset-0 w-56 h-72 rounded-[50%] border-4 border-dashed border-zinc-600 pointer-events-none transition-all duration-300" 
            />
            
            {/* Real-time Feedback Badge */}
            <div 
              ref={feedbackTextRef} 
              className="absolute top-8 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-zinc-300 text-sm font-semibold shadow-lg transition-colors duration-300"
            >
              Loading face detection...
            </div>

            {/* Instruction Overlay */}
            <div className="absolute bottom-10 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent text-center">
              <p className="text-sm font-medium">{VIEWS[currentStep].instruction}</p>
            </div>
          </>
        ) : (
          <div className="text-center p-10 w-full flex flex-col items-center">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Scan Complete</h2>
            <p className="text-zinc-400 mt-2 mb-6">Your results have been sent to the clinic.</p>
            
            {/* Task 3: Patient-Dentist Messaging Component */}
            <MessagingSidebar />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-10 w-full flex justify-center">
        {currentStep < 5 && (
          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
               <Camera className="text-black" />
            </div>
          </button>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 p-4 overflow-x-auto w-full">
        {VIEWS.map((v, i) => (
          <div 
            key={i} 
            className={`w-16 h-20 rounded border-2 shrink-0 ${i === currentStep ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800'}`}
          >
            {capturedImages[i] ? (
               <img src={capturedImages[i]} className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-700">{i+1}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}