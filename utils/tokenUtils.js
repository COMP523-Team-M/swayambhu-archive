// utils/tokenUtils.js
import fs from "fs";
import path from "path";
import { oauth2Client } from "./youtube";

const tokensFilePath = path.join(process.cwd(), "config", "oauthTokens.json");

// Function to retrieve tokens, refreshing the access token if necessary
export async function getTokens() {
  // Check if the token file exists
  if (fs.existsSync(tokensFilePath)) {
    const tokensData = JSON.parse(fs.readFileSync(tokensFilePath));

    // Set the existing tokens in oauth2Client
    oauth2Client.setCredentials(tokensData);

    // Check if the access token is expired
    const tokenExpiryDate = tokensData.expiry_date || 0;
    if (Date.now() >= tokenExpiryDate) {
      console.log("Access token expired. Refreshing token...");

      // Refresh the access token
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      // Update tokens data with the new access token and expiry date
      const updatedTokens = {
        ...tokensData,
        access_token: credentials.access_token,
        expiry_date: credentials.expiry_date,
      };

      // Save the updated tokens to oauthTokens.json
      saveTokens(updatedTokens);

      return updatedTokens;
    }
    
    return tokensData;
  }
  
  console.error("No tokens found. Please authenticate first.");
  return null;
}

// Function to save tokens to oauthTokens.json
export function saveTokens(tokens) {
  fs.writeFileSync(tokensFilePath, JSON.stringify(tokens, null, 2));
}
