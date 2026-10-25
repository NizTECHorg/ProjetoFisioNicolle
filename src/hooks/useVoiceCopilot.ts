import { useState, useRef, useCallback, useEffect } from 'react';

const RECORDING_MIME_TYPE = 'audio/webm;codecs=opus';
const MAX_RECORDING_DURATION_MS = 600_000; // 10 minutes (600.000 ms)
/** Limite mostrado ao usuário (a gravação para sozinha aqui). */
export const MAX_RECORDING_SECONDS = MAX_RECORDING_DURATION_MS / 1000;
export const MAX_RECORDING_LABEL = '10 min';

export interface UseVoiceCopilotReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export function useVoiceCopilot(): UseVoiceCopilotReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const maxTimeoutRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (maxTimeoutRef.current !== null) {
      window.clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    clearTimers();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, [clearTimers]);

  const startRecording = useCallback(async () => {
    // If currently recording, stop previous session first
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanupStream();
    clearTimers();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const options: MediaRecorderOptions =
        typeof MediaRecorder.isTypeSupported === 'function' &&
        MediaRecorder.isTypeSupported(RECORDING_MIME_TYPE)
          ? { mimeType: RECORDING_MIME_TYPE }
          : typeof MediaRecorder.isTypeSupported === 'function' &&
            MediaRecorder.isTypeSupported('audio/webm')
          ? { mimeType: 'audio/webm' }
          : {};

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || RECORDING_MIME_TYPE;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setIsRecording(false);
        cleanupStream();
        clearTimers();
      };

      recorder.start();
      setIsRecording(true);
      setAudioBlob(null);
      setDuration(0);

      // Duration counter in seconds
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Automatic stop after 10 minutes (600.000 ms)
      maxTimeoutRef.current = window.setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_DURATION_MS);
    } catch (err) {
      console.error('Microphone error:', err);
      cleanupStream();
      clearTimers();
      setIsRecording(false);
    }
  }, [cleanupStream, clearTimers, stopRecording]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      cleanupStream();
    };
  }, [clearTimers, cleanupStream]);

  return { isRecording, audioBlob, duration, startRecording, stopRecording };
}
