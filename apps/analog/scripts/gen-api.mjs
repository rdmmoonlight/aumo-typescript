import { execSync } from "child_process";
import dotenv from "dotenv";
import { existsSync, unlinkSync, writeFileSync } from "fs";

dotenv.config();

// Hilangkan trailing slash jika ada biar URL rapi
const baseUrl = (process.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/$/,
  "",
);
const specUrl = `${baseUrl}/openapi/v1.json`;
const tempFile = "./temp-openapi.json";

async function generateApiTypes() {
  try {
    console.log(`📡 Fetching OpenAPI spec dari: ${specUrl}`);

    // 1. Fetch JSON langsung menggunakan native fetch Node.js
    const response = await fetch(specUrl);
    if (!response.ok) {
      throw new Error(
        `HTTP Error! Status: ${response.status} ${response.statusText}`,
      );
    }

    const jsonSpec = await response.json();

    // Validasi sederhana memastikan payload benar-benar spec OpenAPI
    if (!jsonSpec.openapi && !jsonSpec.swagger) {
      throw new Error(
        "Response dari server bukan spesifikasi OpenAPI/Swagger yang valid.",
      );
    }

    // 2. Simpan sementara ke file lokal
    writeFileSync(tempFile, JSON.stringify(jsonSpec, null, 2));
    console.log("💾 Spec berhasil diunduh ke file lokal sementara.");

    // 3. Generate TypeScript types dari file lokal
    console.log("⚙️  Generating TypeScript types...");
    execSync(
      `pnpm dlx openapi-typescript ${tempFile} -o src/app/core/api/v1.d.ts`,
      {
        stdio: "inherit",
      },
    );

    console.log("✅ Berhasil generate types ke src/app/core/api/v1.d.ts!");
  } catch (error) {
    console.error("❌ Gagal generate API types:", error.message);
    process.exit(1);
  } finally {
    // 4. Bersihkan file temporary
    if (existsSync(tempFile)) {
      unlinkSync(tempFile);
    }
  }
}

generateApiTypes();
