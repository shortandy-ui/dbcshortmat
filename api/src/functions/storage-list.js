const { app } = require("@azure/functions");
const { getContainerClient } = require("../../blobHelper");

app.http("storageList", {
  route: "storage-list",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const prefix = request.query.get("prefix") || "";

    let container;
    try {
      container = await getContainerClient();
    } catch (e) {
      return { status: 500, jsonBody: { error: e.message } };
    }

    const keys = [];
    for await (const blob of container.listBlobsFlat({ prefix })) {
      keys.push(blob.name);
    }
    return { status: 200, jsonBody: { keys, prefix, shared: true } };
  },
});
