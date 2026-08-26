const { app } = require("@azure/functions");
const { getContainerClient, streamToText } = require("../../blobHelper");

app.http("storage", {
  route: "storage/{key}",
  methods: ["GET", "PUT", "DELETE"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const key = request.params.key;
    if (!key) {
      return { status: 400, jsonBody: { error: "Missing key" } };
    }

    let container;
    try {
      container = await getContainerClient();
    } catch (e) {
      return { status: 500, jsonBody: { error: e.message } };
    }

    const blockBlob = container.getBlockBlobClient(key);

    if (request.method === "GET") {
      try {
        const download = await blockBlob.download();
        const value = await streamToText(download.readableStreamBody);
        return { status: 200, jsonBody: { key, value, shared: true } };
      } catch (e) {
        return { status: 404, jsonBody: { error: "not found" } };
      }
    }

    if (request.method === "PUT") {
      let body = {};
      try {
        body = await request.json();
      } catch (e) {
        body = {};
      }
      const value = body.value;
      if (typeof value !== "string") {
        return { status: 400, jsonBody: { error: "value must be a string" } };
      }
      const buffer = Buffer.from(value, "utf8");
      await blockBlob.upload(buffer, buffer.length, {
        overwrite: true,
        blobHTTPHeaders: { blobContentType: "application/json" },
      });
      return { status: 200, jsonBody: { key, value, shared: true } };
    }

    if (request.method === "DELETE") {
      await blockBlob.deleteIfExists();
      return { status: 200, jsonBody: { key, deleted: true, shared: true } };
    }

    return { status: 405, jsonBody: { error: "method not allowed" } };
  },
});
