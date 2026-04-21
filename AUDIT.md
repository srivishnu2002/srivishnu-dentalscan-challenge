# UX & Technical Audit

## Summary
Three UX friction points and four technical root causes identified, ordered by user impact.

---

## UX Findings

### 1. Rigid Guide Geometry - Critical
The oval guide stays static, but the face naturally elongates during upper/lower scans, forcing awkward contortions to satisfy the centering requirement. 
**Fix:** Dynamically morph the guide shape per scan step.

### 2. Unforgiving Capture Thresholds - Critical
The countdown resets instantly on any micro-jitter, trapping users in a frustrating retry loop. 
**Fix:** Add a 300ms tolerance buffer before resetting.

### 3. Subtle Error Cues - Medium
"Image too blurry" badges appear at screen edges while attention is locked on the center reticle - frequently missed. 
**Fix:** Centralize error icons and add haptic feedback.

---

## Technical Root Causes

### 1. Autofocus Hunting - Critical
Bringing the device closer triggers continuous macro-focus hunting, causing temporary blur and false-negative stability alerts. 
**Fix:** Lock focus once a face is detected; re-trigger only on significant positional change.

### 2. Variable Hardware FOV - Critical
Wide-angle lenses force users uncomfortably close to the screen, killing hand stability. **Fix:** Detect FOV at session start and scale the guide diameter proportionally.

### 3. Main-Thread Thrashing - Medium
Per-frame stability checks toggling Red/Amber/Green states risk heavy re-render lag. **Fix:** Decouple the evaluation loop from React state using Refs; commit to state only on confirmed threshold transitions.

### 4. Low-Light Shutter Lag - Medium
Reduced shutter speed in poor lighting causes motion blur that fails face-detection models. 
**Fix:** Poll ambient light levels and warn the user before they enter the capture loop.
