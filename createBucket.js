require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

// Use credentials from environment variables
process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.PATH_TO_CLOUD_STORAGE_CRED_JSON_KEY;

const bucketName = 'swayambhu-video-bucket';
const storage = new Storage();

async function createBucket() {
  try {
    const [bucket] = await storage.createBucket(bucketName, {
      location: 'US', // Set region
      storageClass: 'STANDARD', // Use 'STANDARD' for frequently accessed data
    });
    console.log(`Bucket ${bucket.name} created successfully.`);
  } catch (error) {
    console.error("Error creating bucket:", error);
  }
}

createBucket();







