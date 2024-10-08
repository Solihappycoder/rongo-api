import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import connectToClient from "../../lib/mongo.js";
import { z } from "zod";

const app = new Hono();

// Define constants for the fixed database, collection, and MongoDB URI
const DATABASE_NAME = "vibeclub"; // Set your database name
const COLLECTION_NAME = "users"; // Set your collection name
const MONGODB_URI = "mongodb+srv://solyoung998:9OWqrHrh3sdhr5bN@cluster0.dcmdx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Set your MongoDB URI

// Schema for the request body (filter, projection, etc.)
const bodySchema = z.object({
	filter: z.record(z.any()),
	projection: z.record(z.number()).optional(),
	sort: z.record(z.number()).optional(),
	limit: z.number().optional(),
	skip: z.number().optional(),
});

app.post(
	"/",
	zValidator("json", bodySchema),
	zValidator("header", headerSchema),

	async (c) => {
		let client;
		try {
			// Use the fixed URI instead of getting it from headers
			client = await connectToClient(MONGODB_URI);

			const parsedBody = bodySchema.parse(await c.req.json());

			const db = client.db(DATABASE_NAME); // Use the fixed database
			const collection = db.collection(COLLECTION_NAME); // Use the fixed collection
			const result = await collection.findOne(parsedBody.filter, {
				projection: parsedBody.projection,
			});

			await client.close();
			return c.json({ document: result });
		} catch (error) {
			if (client) {
				await client.close();
			}
			return c.json({ success: false, message: "An error occurred" }, 500);
		}
	}
);

app.all("/", (c) => {
	return c.json({ success: false, message: "Method not allowed" }, 405);
});

export default app;
