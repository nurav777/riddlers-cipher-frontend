import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

interface PollyConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  voiceId: string;
  engine: string;
}

class BackendPollyService {
  private config: PollyConfig;
  private pollyClient: PollyClient;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_MS = 1000; // 1 second between requests

  constructor() {
    this.config = {
      region: process.env.POLLY_REGION || 'us-east-1',
      accessKeyId: process.env.POLLY_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.POLLY_SECRET_ACCESS_KEY || '',
      voiceId: process.env.POLLY_VOICE_ID || 'Joanna',
      engine: process.env.POLLY_ENGINE || 'neural'
    };

    this.pollyClient = new PollyClient({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }

  async synthesizeSpeech(text: string): Promise<Buffer | null> {
    try {
      // Rate limiting protection
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_MS - timeSinceLastRequest));
      }
      this.lastRequestTime = Date.now();

      const command = new SynthesizeSpeechCommand({
        Text: text,
        OutputFormat: 'mp3',
        VoiceId: this.config.voiceId as any,
        Engine: this.config.engine as any,
        TextType: 'text',
        SampleRate: '22050'
      });

      const response = await this.pollyClient.send(command);
      console.log('Polly response received, AudioStream type:', typeof response.AudioStream);
      
      if (response.AudioStream) {
        // Use the correct method to convert stream to buffer
        const audioData = await response.AudioStream.transformToByteArray();
        const buffer = Buffer.from(audioData);
        console.log('Audio buffer created, size:', buffer.length, 'bytes');
        return buffer;
      }
      
      return null;
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      return null;
    }
  }

  formatTextForSpeech(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<emphasis level="strong">$1</emphasis>')
      .replace(/\*(.*?)\*/g, '<emphasis level="moderate">$1</emphasis>')
      .replace(/→/g, 'to')
      .replace(/—/g, 'dash')
      .replace(/"/g, '')
      .replace(/'/g, '')
      .trim();
  }
}

export const backendPollyService = new BackendPollyService();
export default backendPollyService;
