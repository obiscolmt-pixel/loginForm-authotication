require("dotenv").config();
const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ── Nodemailer transporter ────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: true, // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendLoginNotification(userEmail) {
  const mailOptions = {
    from: `"Login Alert 🔔" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: "🔐 New Login Detected",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
        <h2 style="color: #1a1a2e; margin-bottom: 8px;">Login Notification</h2>
        <p style="color: #555; font-size: 15px;">A user just logged in to your app.</p>
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #e94560;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #999; text-transform: uppercase; letter-spacing: 1px;">User</p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1a1a2e;">${userEmail}</p>
        </div>
        <div style="background: white; border-radius: 8px; padding: 20px; border-left: 4px solid #0f3460;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Time</p>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1a1a2e;">${new Date().toUTCString()}</p>
        </div>
        <p style="color: #aaa; font-size: 12px; margin-top: 24px;">This is an automated security alert.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Login notification sent for: ${userEmail}`);
}

// ── Routes ────────────────────────────────────────────────

// Serve login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Serve home page
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// Login endpoint
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // ── Basic validation ──
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  // ── Auth check (replace with your DB / hashed-password logic) ──
  const validEmail = process.env.DEMO_EMAIL || "user@example.com";
  const validPassword = process.env.DEMO_PASSWORD || "password123";

  if (email !== validEmail || password !== validPassword) {
    return res.status(401).json({ success: false, message: "Invalid email or password." });
  }

  // ── Send email notification (non-blocking) ──
  try {
    await sendLoginNotification(email);
  } catch (err) {
    console.error("⚠️  Email notification failed:", err.message);
    // Don't block login if email fails
  }

  return res.json({ success: true, redirect: "/home" });
});

// ── Start server ──────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running → http://localhost:${PORT}`);
  console.log(`   Login with: ${process.env.DEMO_EMAIL || "user@example.com"} / ${process.env.DEMO_PASSWORD || "password123"}\n`);
});