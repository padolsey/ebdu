# Embedding REST Service

A REST service for querying documents via embeddings.

## Requirements

- Node.js v15+
- AWS S3 bucket for storing embeddings and text chunks
- AWS credentials with access to the S3 bucket

## Setup

1. Clone the repository.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your AWS credentials and configuration:
   ```
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=your_aws_region
   AWS_S3_BUCKET=your_s3_bucket_name
   PORT=3000
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Usage

### Endpoint

`GET /search`

### Parameters

- `documentUrls`: URL-encoded list of document URLs (textual formats like TXT, HTML, PDF, etc.)
- `tokens` (optional): How many relevant tokens to return. Default is 1000.
- `n` (optional): How many items to return. Default is 3.
- `query`: The query string.

### Example

```bash
curl 'http://localhost:3000/search?documentUrls=https%3A%2F%2Fexample.com%2Fdoc1.txt&documentUrls=https%3A%2F%2Fexample.com%2Fdoc2.pdf&query=your%20search%20query&tokens=500&n=5'
```

### Response

If embeddings are still being processed:

```json
{
  "progress": "embedding",
  "results": []
}
```

When embeddings are ready:

```json
{
  "progress": "finished_embedding",
  "results": [
    {
      "documentUrl": "https://example.com/doc1.txt",
      "chunk": "Relevant text chunk...",
      "percentThroughDocument": 50.0
    }
    // more results...
  ]
}
```

Notes

- The service will store embeddings and text chunks in the specified S3 bucket.
- Embeddings are reused if they already exist for the given set of document URLs.
- The text chunks are stored per document URL, using a hash of the URL.
- The service can be polled to check the progress of embedding creation.