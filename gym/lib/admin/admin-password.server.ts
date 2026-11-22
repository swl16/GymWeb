import "server-only";
import { scrypt, timingSafeEqual } from "node:crypto";
// Fixed admin credential: only its randomly salted scrypt verifier is stored.
// Parameters: N=2^15, r=8, p=3; 32 MiB working memory (64 MiB allocation limit).
const SALT = Buffer.from("9113866197820fc36e66ee16a93cf207", "hex");
const PASSWORD_HASH = Buffer.from(
  "ed8acd4d1e191b18873f7beb84786ab00a415e2485b4fad9fff388e6e2c360ef63f2878e894887c4417345fd098420dfcba3f8140a0e1b905b5052f1fb958760",
  "hex",
);
/** Verify on the server without storing plaintext or blocking the Node event loop. */
export async function verifyAdminPassword(value: unknown): Promise<boolean> {
  if (typeof value !== "string" || !value || value.length > 1024) return false;
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      value,
      SALT,
      PASSWORD_HASH.length,
      { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 },
      (error, key) => {
        if (error) reject(error);
        else resolve(key);
      },
    );
  });
  return timingSafeEqual(derived, PASSWORD_HASH);
}
