// Amazon Polly Service for Text-to-Speech
// Uses backend API for secure AWS access

interface PollyResponse {
  audioStream: ArrayBuffer;
  contentType: string;
}

class PollyService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  }

  async synthesizeSpeech(text: string): Promise<PollyResponse | null> {
    try {
      console.log('Making request to:', `${this.apiBaseUrl}/api/polly/synthesize`);

      const response = await fetch(`${this.apiBaseUrl}/api/polly/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error('Polly API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        return null;
      }

      const audioBuffer = await response.arrayBuffer();
      console.log('Received audio buffer, size:', audioBuffer.byteLength);

      return {
        audioStream: audioBuffer,
        contentType: 'audio/mpeg'
      };
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Backend server may not be running. Check if backend is started on port 3001');
      }
      return null;
    }
  }

  async playAudio(audioResponse: PollyResponse): Promise<void> {
    try {
      const audioBlob = new Blob([audioResponse.audioStream], {
        type: audioResponse.contentType
      });
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audio.play();

      // Clean up the URL after playing
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  async speak(text: string): Promise<void> {
    const audioResponse = await this.synthesizeSpeech(text);
    if (audioResponse) {
      await this.playAudio(audioResponse);
    }
  }

  // Utility method to format text for better speech synthesis
  formatTextForSpeech(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<emphasis level="strong">$1</emphasis>') // Bold text
      .replace(/\*(.*?)\*/g, '<emphasis level="moderate">$1</emphasis>')   // Italic text
      .replace(/→/g, 'to')  // Replace arrow with "to"
      .replace(/—/g, 'dash') // Replace em dash
      .replace(/"/g, '')    // Remove quotes for cleaner speech
      .replace(/'/g, '')    // Remove apostrophes
      .trim();
  }
}

// Export singleton instance
export const pollyService = new PollyService();
export default pollyService;
