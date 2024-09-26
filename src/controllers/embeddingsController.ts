import { Request, Response } from 'express';
import embeddingsService from '../services/embeddingsService';

class EmbeddingsController {
  async search(req: Request, res: Response) {
    const { documentUrls, tokens, n, query } = req.query;

    if (!documentUrls || !query) {
      return res.status(400).json({ error: 'documentUrls and query are required' });
    }

    // Parse parameters
    const documentUrlsArray = Array.isArray(documentUrls)
      ? (documentUrls as string[])
      : [documentUrls as string];
    const tokensNumber = tokens ? parseInt(tokens as string, 10) : 1000;
    const nNumber = n ? parseInt(n as string, 10) : 3;
    const queryString = query as string;

    try {
      const result = await embeddingsService.handleSearch(
        documentUrlsArray,
        tokensNumber,
        nNumber,
        queryString
      );

      if (result.progress === 'error') {
        return res.status(500).json({ error: result.error });
      }

      return res.json(result);
    } catch (error) {
      console.error('Error in embeddingsController:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new EmbeddingsController();