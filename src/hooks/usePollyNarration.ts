import { useState, useCallback, useRef } from 'react';
import { pollyService } from '@/services/pollyService';

interface UsePollyNarrationOptions {
  enabled?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

interface UsePollyNarrationReturn {
  isPlaying: boolean;
  isProcessing: boolean;
  hasError: boolean;
  errorMessage: string;
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  clearError: () => void;
}

export const usePollyNarration = (options: UsePollyNarrationOptions = {}): UsePollyNarrationReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnabled, setIsEnabled] = useState(options.enabled ?? true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stop = useCallback(() => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
      } catch (error) {
        console.log('Audio already stopped or interrupted');
      }
      currentAudioRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPlaying(false);
    setIsProcessing(false);
    setHasError(false);
    setErrorMessage('');
  }, []);

  const clearError = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!isEnabled || !text.trim()) return;

    try {
      // Stop any currently playing audio
      stop();
      
      setIsProcessing(true);
      setHasError(false);
      setErrorMessage('');
      options.onStart?.();

      // Set up 30-second timeout (backend needs more time for AWS Polly)
      timeoutRef.current = setTimeout(() => {
        setIsProcessing(false);
        setHasError(true);
        setErrorMessage('Error in fetching narration');
        options.onError?.(new Error('Narration timeout - Backend may be slow'));
      }, 30000);

      // Format text for better speech synthesis
      const formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<emphasis level="strong">$1</emphasis>') // Bold text
        .replace(/\*(.*?)\*/g, '<emphasis level="moderate">$1</emphasis>')   // Italic text
        .replace(/→/g, 'to')  // Replace arrow with "to"
        .replace(/—/g, 'dash') // Replace em dash
        .replace(/"/g, '')    // Remove quotes for cleaner speech
        .replace(/'/g, '')    // Remove apostrophes
        .trim();

      // Synthesize speech
      console.log('Requesting narration for:', formattedText.substring(0, 50) + '...');
      const audioResponse = await pollyService.synthesizeSpeech(formattedText);
      
      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (!audioResponse) {
        console.warn('Failed to synthesize speech - Backend returned null');
        setIsProcessing(false);
        setHasError(true);
        setErrorMessage('Error in fetching narration');
        return;
      }
      
      console.log('Audio response received, size:', audioResponse.audioStream.byteLength);

      // Create and play audio
      const audioBlob = new Blob([audioResponse.audioStream], { 
        type: audioResponse.contentType 
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      // Set up event listeners
      audio.addEventListener('loadstart', () => {
        setIsProcessing(false);
        setIsPlaying(true);
        setHasError(false);
        setErrorMessage('');
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        options.onEnd?.();
      });

      audio.addEventListener('error', (error) => {
        console.error('Audio playback error:', error);
        setIsPlaying(false);
        setIsProcessing(false);
        setHasError(true);
        setErrorMessage('Error playing narration');
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        options.onError?.(new Error(error.message || 'Audio playback failed'));
      });

      // Start playback with error handling
      try {
        await audio.play();
      } catch (playError) {
        if (playError.name === 'AbortError') {
          console.log('Audio playback was interrupted (normal behavior)');
          return; // Don't treat interruption as an error
        }
        throw playError; // Re-throw other errors
      }
      
    } catch (error) {
      console.error('Error in speak function:', error);
      setIsProcessing(false);
      setIsPlaying(false);
      setHasError(true);
      setErrorMessage('Error in fetching narration');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      options.onError?.(error as Error);
    }
  }, [isEnabled, stop, options]);

  const setEnabled = useCallback((enabled: boolean) => {
    if (!enabled) {
      stop();
    }
    setIsEnabled(enabled);
  }, [stop]);

  return {
    isPlaying,
    isProcessing,
    hasError,
    errorMessage,
    speak,
    stop,
    isEnabled,
    setEnabled,
    clearError
  };
};

export default usePollyNarration;
