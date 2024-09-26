import { Request, Response } from 'express';
import embeddingsService from '../services/embeddingsService';

class UIController {
  renderForm(req: Request, res: Response) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Embedding Search Interface</title>
        <script>
          async function submitForm(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const params = new URLSearchParams();
            for (const pair of formData.entries()) {
              params.append(pair[0], pair[1]);
            }

            const responseDiv = document.getElementById('response');
            responseDiv.innerHTML = '<p>Starting embedding process...</p>';

            async function poll() {
              try {
                const response = await fetch('/ui', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: params.toString(),
                });
                const result = await response.json();

                if (result.progress === 'error') {
                  responseDiv.innerHTML = '<p>Error: ' + result.error + '</p>';
                } else if (result.progress === 'embedding') {
                  responseDiv.innerHTML = '<p>Embedding in progress...</p>';
                  setTimeout(poll, 2000); // Poll every 2 seconds
                } else if (result.progress === 'finished_embedding') {
                  responseDiv.innerHTML = '<h2>Search Results</h2><pre>' + JSON.stringify(result, null, 2) + '</pre>';
                }
              } catch (error) {
                console.error('Error:', error);
                responseDiv.innerHTML = '<p>Error occurred. Please try again.</p>';
              }
            }

            poll();
          }
        </script>
      </head>
      <body>
        <h1>Embedding Search Interface</h1>
        <form id="searchForm" onsubmit="submitForm(event)">
          <label for="documentUrls">Document URLs (comma-separated):</label><br>
          <input type="text" id="documentUrls" name="documentUrls" size="100"><br><br>

          <label for="tokens">Tokens (optional):</label><br>
          <input type="number" id="tokens" name="tokens" value="1000"><br><br>

          <label for="n">Number of items to return (optional):</label><br>
          <input type="number" id="n" name="n" value="3"><br><br>

          <label for="query">Query:</label><br>
          <textarea id="query" name="query" rows="4" cols="100"></textarea><br><br>

          <input type="submit" value="Search">
        </form>
        <div id="response"></div>
      </body>
      </html>
    `);
  }

  async handleFormSubmission(req: Request, res: Response) {
    const { documentUrls, tokens, n, query } = req.body;

    if (!documentUrls || !query) {
      return res.status(400).json({ error: 'Document URLs and query are required.' });
    }

    // Split document URLs by comma and trim whitespace
    const documentUrlsArray = documentUrls.split(',').map((url: string) => url.trim());

    const tokensNumber = tokens ? parseInt(tokens, 10) : 1000;
    const nNumber = n ? parseInt(n, 10) : 3;

    try {
      const result = await embeddingsService.handleSearch(
        documentUrlsArray,
        tokensNumber,
        nNumber,
        query
      );

      // Return the result as JSON for the AJAX request
      res.json(result);
    } catch (error) {
      console.error('Error in UIController:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }

}

export default new UIController();