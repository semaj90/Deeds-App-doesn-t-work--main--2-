import { j as json } from "../../../../../chunks/index.js";
import { d as db, u as users } from "../../../../../chunks/index3.js";
import bcrypt from "bcryptjs";
import "jsonwebtoken";
import { eq } from "drizzle-orm";
process.env.JWT_SECRET || "fallback-secret-key";
process.env.JWT_EXPIRATION || "86400";
async function hashPassword(password) {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
  return bcrypt.hash(password, rounds);
}
const POST = async ({ request }) => {
  try {
    const { name, email, password } = await request.json();
    console.log("[Register API] Received data:", { name, email, password: "***" });
    if (!email || !password || !name) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return json({ error: "User already exists" }, { status: 400 });
    }
    const hashedPassword = await hashPassword(password);
    const [newUser] = await db.insert(users).values({
      email,
      hashedPassword,
      name,
      firstName: name.split(" ")[0] || "",
      lastName: name.split(" ").slice(1).join(" ") || "",
      role: "prosecutor"
    }).returning();
    console.log("[Register API] User created successfully:", newUser.id);
    return json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("[Register API] Error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
export {
  POST
};
