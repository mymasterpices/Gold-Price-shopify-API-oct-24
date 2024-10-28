import db from "../db.server";
import { json } from '@remix-run/node';

export async function loader() {
    try {
        const current_rate = await db.SaveRates.findFirst();

        // Check if current_rate was found
        if (!current_rate) {
            return json({ message: "No current rate found." }, { status: 404 });
        }
        // Return the current_rate as JSON with CORS
        const response = json(current_rate);
        return response; // Use CORS here

    } catch (error) {
        console.error("Error fetching gold rates:", error);
        return json({ message: "Internal Server Error" }, { status: 500 });
    }
}