// pages/api/auth.js
import { oauth2Client } from "../../utils/youtube";

export default function handler(req, res) {
  const scopes = ["https://www.googleapis.com/auth/youtube.upload"];
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // Requests offline access to get a refresh token
    prompt: "consent",      // Forces consent to ensure refresh token is provided
    scope: scopes,
  });
  res.redirect(authUrl);
}
