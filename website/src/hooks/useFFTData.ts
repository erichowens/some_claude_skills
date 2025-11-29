import { useEffect, useRef, useState } from 'react';

/**
 * useFFTData - Real-time FFT frequency analysis hook
 *
 * Extracts frequency data from an AnalyserNode and returns
 * normalized values suitable for visualization.
 *
 * @param analyserNode - Web Audio API AnalyserNode
 * @param binCount - Number of frequency bins to return (default: 24)
 * @param smoothing - Smoothing factor 0-1, higher = smoother (default: 0.7)
 * @param isPlaying - Whether audio is currently playing
 * @returns Uint8Array of frequency magnitudes (0-255)
 */
interface UseFFTDataOptions {
  analyserNode: AnalyserNode | null;
  binCount?: number;
  smoothing?: number;
  isPlaying?: boolean;
}

export function useFFTData({
  analyserNode,
  binCount = 24,
  smoothing = 0.7,
  isPlaying = false,
}: UseFFTDataOptions): number[] {
  const [frequencyData, setFrequencyData] = useState<number[]>(
    () => new Array(binCount).fill(0)
  );
  const smoothedDataRef = useRef<Float32Array>(new Float32Array(binCount));
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset to zero when not playing
    if (!analyserNode || !isPlaying) {
      // Smoothly decay to zero
      const decay = () => {
        let allZero = true;
        const newData = new Array(binCount);

        for (let i = 0; i < binCount; i++) {
          smoothedDataRef.current[i] *= 0.85; // Decay factor
          if (smoothedDataRef.current[i] > 0.5) {
            allZero = false;
          }
          newData[i] = Math.round(smoothedDataRef.current[i]);
        }

        setFrequencyData(newData);

        if (!allZero) {
          rafIdRef.current = requestAnimationFrame(decay);
        }
      };

      decay();
      return () => {
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }
      };
    }

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateFrequencyData = () => {
      // Get frequency data from analyser (0-255 values)
      analyserNode.getByteFrequencyData(dataArray);

      // Use compressed frequency range for MIDI visualization
      // MIDI audio is concentrated in lower frequencies, so we use only a portion of the spectrum
      // and spread it evenly across all bars
      const newData = new Array(binCount);

      // MIDI content is mostly in the first 25-30% of the spectrum
      const usableRange = Math.floor(bufferLength * 0.3); // Use only 30% of spectrum
      const binsPerBar = Math.max(1, Math.floor(usableRange / binCount));

      for (let i = 0; i < binCount; i++) {
        const start = i * binsPerBar;
        const end = Math.min(start + binsPerBar, usableRange);

        let sum = 0;
        let count = 0;
        for (let j = start; j < end; j++) {
          sum += dataArray[j];
          count++;
        }

        const average = count > 0 ? sum / count : 0;

        // Boost the signal since MIDI tends to be quieter
        const boosted = Math.min(255, average * 2.0);

        // Apply exponential moving average for smoothing
        smoothedDataRef.current[i] =
          smoothing * smoothedDataRef.current[i] +
          (1 - smoothing) * boosted;

        newData[i] = Math.round(smoothedDataRef.current[i]);
      }

      setFrequencyData(newData);
      rafIdRef.current = requestAnimationFrame(updateFrequencyData);
    };

    // Start the animation loop
    rafIdRef.current = requestAnimationFrame(updateFrequencyData);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [analyserNode, binCount, smoothing, isPlaying]);

  return frequencyData;
}

/**
 * useVUMeter - Real-time VU meter with peak hold
 *
 * Calculates RMS level from time-domain audio data
 * and tracks peak values with decay.
 */
interface UseVUMeterOptions {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
}

interface VUMeterData {
  level: number;      // Current RMS level (0-100)
  peak: number;       // Peak level with hold (0-100)
  isClipping: boolean; // True if level > 95%
}

export function useVUMeter({
  analyserNode,
  isPlaying,
}: UseVUMeterOptions): VUMeterData {
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const rafIdRef = useRef<number | null>(null);
  const peakTimeoutRef = useRef<number | null>(null);
  const peakValueRef = useRef(0);

  useEffect(() => {
    if (!analyserNode || !isPlaying) {
      // Decay to zero
      const decay = () => {
        setLevel((prev) => {
          const newLevel = prev * 0.9;
          if (newLevel < 1) return 0;
          rafIdRef.current = requestAnimationFrame(decay);
          return newLevel;
        });
        setPeak((prev) => {
          const newPeak = prev * 0.95;
          return newPeak < 1 ? 0 : newPeak;
        });
      };
      decay();
      return () => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        if (peakTimeoutRef.current) clearTimeout(peakTimeoutRef.current);
      };
    }

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);

    const updateLevel = () => {
      // Get time-domain data
      analyserNode.getByteTimeDomainData(dataArray);

      // Calculate RMS (Root Mean Square) level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        // Normalize to -1 to 1 range (128 is center)
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // Convert to dB scale (-60 to 0 dB), then to 0-100
      const db = 20 * Math.log10(rms || 0.0001);
      const normalizedLevel = Math.max(0, Math.min(100, ((db + 60) / 60) * 100));

      setLevel(normalizedLevel);

      // Update peak with hold
      if (normalizedLevel > peakValueRef.current) {
        peakValueRef.current = normalizedLevel;
        setPeak(normalizedLevel);

        // Clear existing timeout
        if (peakTimeoutRef.current) {
          clearTimeout(peakTimeoutRef.current);
        }

        // Hold peak for 1.5 seconds, then decay
        peakTimeoutRef.current = window.setTimeout(() => {
          peakValueRef.current = 0;
        }, 1500);
      }

      rafIdRef.current = requestAnimationFrame(updateLevel);
    };

    rafIdRef.current = requestAnimationFrame(updateLevel);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (peakTimeoutRef.current) clearTimeout(peakTimeoutRef.current);
    };
  }, [analyserNode, isPlaying]);

  return {
    level,
    peak,
    isClipping: level > 95,
  };
}

export default useFFTData;
