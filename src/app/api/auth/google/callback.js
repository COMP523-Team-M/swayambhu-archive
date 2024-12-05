// pages/api/auth/google/callback.js
import { oauth2Client } from "../../../../../utils/youtube.js";

export default async function handler(req, res) {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens); // This stores the tokens in oauth2Client

    // Log tokens to confirm they are received
    console.log("Tokens received and set:", tokens);

    res
      .status(200)
      .json({
        message: "Authentication successful! You can now upload videos.",
      });
  } catch (error) {
    console.error("Error during authentication:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
}
