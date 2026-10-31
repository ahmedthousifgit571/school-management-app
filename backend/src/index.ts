import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";

// Mirrors the Role enum in prisma/schema.prisma. Swap for the generated
// Prisma type once auth is backed by the database.
const ROLES = ["SUPERADMIN", "ADMIN", "TEACHER", "STUDENT", "PARENT"] as const;
type Role = (typeof ROLES)[number];

const isRole = (value: unknown): value is Role =>
  typeof value === "string" && (ROLES as readonly string[]).includes(value);

const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000";

const app = express();

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Mock login: accepts any email/password and issues a signed JWT.
// Pass an optional `role` in the body to test role-specific UI.
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password, role } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const user = {
    id: "mock-user-id",
    email: String(email),
    role: isRole(role) ? role : "TEACHER",
  };

  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({ token, user });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
