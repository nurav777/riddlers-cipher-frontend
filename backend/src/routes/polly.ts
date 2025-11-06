import { Router } from 'express';
import { backendPollyService } from '../services/pollyService';

const router = Router();

// Synthesize speech endpoint
router.post('/synthesize', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const formattedText = backendPollyService.formatTextForSpeech(text);
    const audioBuffer = await backendPollyService.synthesizeSpeech(formattedText);
    
    if (!audioBuffer) {
      return res.status(500).json({ error: 'Failed to synthesize speech' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
    });
    
    res.send(audioBuffer);
  } catch (error) {
    console.error('Polly route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
