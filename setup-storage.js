// setup-storage.js
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStorage() {
  try {
    console.log("Setting up Supabase Storage...");

    // Check if bucket exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error("Error listing buckets:", listError);
      return;
    }

    console.log(
      "Available buckets:",
      buckets.map((b) => b.name)
    );

    // Create product-images bucket if it doesn't exist
    const hasProductImages = buckets.some((b) => b.name === "product-images");

    if (!hasProductImages) {
      console.log("Creating product-images bucket...");

      // Try to create bucket via API
      const { data: newBucket, error: createError } =
        await supabase.storage.createBucket("product-images", {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
          ],
        });

      if (createError) {
        console.error("Error creating bucket:", createError);
        console.log("\n--- MANUAL SETUP REQUIRED ---");
        console.log("Please create the bucket manually in Supabase Dashboard:");
        console.log(
          "1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/storage"
        );
        console.log('2. Click "New bucket"');
        console.log("3. Name: product-images");
        console.log('4. Check "Public bucket"');
        console.log('5. Click "Create bucket"');
        return;
      }

      console.log("Bucket created successfully:", newBucket);
    } else {
      console.log("product-images bucket already exists");
    }

    // Test upload
    console.log("\nTesting upload...");
    const testFile = Buffer.from("test");
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload("test.txt", testFile, {
        contentType: "text/plain",
      });

    if (uploadError) {
      console.error("Test upload failed:", uploadError);
    } else {
      console.log("Test upload successful:", uploadData);

      // Clean up test file
      await supabase.storage.from("product-images").remove(["test.txt"]);
      console.log("Test file cleaned up");
    }

    console.log("\n✅ Storage setup complete!");
  } catch (error) {
    console.error("Setup error:", error);
  }
}

setupStorage();
