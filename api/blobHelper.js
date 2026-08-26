const { BlobServiceClient } = require("@azure/storage-blob");

// Distinct container name so this can safely share a Storage Account with
// another app (e.g. the Hatfield Indoor Bowls site) without key collisions.
const CONTAINER_NAME = "datchworth-data";
let containerClientPromise = null;

// Blob names in this app never contain "/" (they're things like
// "datchworth-short-mat-data" or "datchworth-backup-2026-08-01T12:34:56.789Z"),
// so keys are used as blob names directly with no extra encoding needed.
function getContainerClient() {
  if (!containerClientPromise) {
    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connStr) {
      throw new Error(
        "AZURE_STORAGE_CONNECTION_STRING is not set. Add it under your Static Web App's " +
          "Configuration > Application settings in the Azure Portal."
      );
    }
    const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
    const container = blobServiceClient.getContainerClient(CONTAINER_NAME);
    containerClientPromise = container.createIfNotExists().then(() => container);
  }
  return containerClientPromise;
}

async function streamToText(readableStream) {
  const chunks = [];
  for await (const chunk of readableStream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

module.exports = { getContainerClient, streamToText, CONTAINER_NAME };
