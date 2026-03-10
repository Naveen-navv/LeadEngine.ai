import "dotenv/config";
import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("database.db");
const JWT_SECRET = process.env.SESSION_SECRET || "lead-engine-jwt-secret";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    googleId TEXT UNIQUE,
    displayName TEXT,
    email TEXT,
    avatar TEXT
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    userId TEXT,
    platform TEXT,
    author TEXT,
    content TEXT,
    url TEXT,
    timestamp TEXT,
    analysis TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS brand_context (
    userId TEXT PRIMARY KEY,
    websiteUrl TEXT,
    productName TEXT,
    productDescription TEXT,
    audienceSegments TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Required for secure cookies behind a proxy (Cloud Run)
  app.set("trust proxy", 1);

  app.use(express.json());
  // express-session handles cookies internally, cookie-parser is not required and can sometimes conflict
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "lead-engine-secret",
      resave: true, // Set to true to ensure session is kept alive in memory store
      saveUninitialized: false,
      proxy: true,
      cookie: {
        secure: true,
        sameSite: "none",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Middleware to check for JWT in Authorization header
  app.use((req: any, res: any, next: any) => {
    if (req.user) return next(); // Already authenticated via session

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
        console.log("Authenticated via JWT:", decoded.id);
      } catch (err) {
        console.error("JWT verification failed:", err);
      }
    }
    next();
  });

  passport.serializeUser((user: any, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser((id: string, done) => {
    try {
      console.log("Deserializing user ID:", id);
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      if (!user) {
        console.log("User not found during deserialization");
      }
      done(null, user);
    } catch (err) {
      console.error("Deserialization error:", err);
      done(err);
    }
  });

  const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
  console.log(`Auth Callback URL configured as: ${APP_URL}/auth/google/callback`);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "dummy",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy",
        callbackURL: `${APP_URL}/auth/google/callback`,
        proxy: true
      },
      (accessToken, refreshToken, profile, done) => {
        try {
          let user = db.prepare("SELECT * FROM users WHERE googleId = ?").get(profile.id) as any;
          if (!user) {
            const id = Math.random().toString(36).substring(7);
            db.prepare(
              "INSERT INTO users (id, googleId, displayName, email, avatar) VALUES (?, ?, ?, ?, ?)"
            ).run(
              id,
              profile.id,
              profile.displayName,
              profile.emails?.[0]?.value,
              profile.photos?.[0]?.value
            );
            user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Auth Routes
  app.get("/auth/google", (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "dummy") {
      return res.status(500).send("Google Client ID not configured in environment variables.");
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth/failure" }),
    (req, res) => {
      const user = req.user as any;
      const token = jwt.sign({ id: user.id, displayName: user.displayName, email: user.email, avatar: user.avatar }, JWT_SECRET, { expiresIn: '24h' });

      // Explicitly save the session before responding to ensure persistence
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.redirect("/auth/failure");
        }
        console.log(`User ${req.user ? (req.user as any).displayName : 'unknown'} logged in successfully, session saved.`);
        res.send(`
          <html>
            <body>
              <script>
                console.log("Auth success, sending message to opener...");
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'OAUTH_AUTH_SUCCESS',
                    token: '${token}',
                    user: ${JSON.stringify(user)}
                  }, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              </script>
              <p>Authentication successful. This window should close automatically.</p>
            </body>
          </html>
        `);
      });
    }
  );

  app.get("/auth/failure", (req, res) => {
    res.send("Authentication failed. Please check your Google Cloud Console configuration and environment variables.");
  });

  app.get("/api/me", (req, res) => {
    res.json(req.user || null);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  // Database API Routes
  app.get("/api/leads", (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const userLeads = db.prepare("SELECT * FROM leads WHERE userId = ?").all((req.user as any).id);
    res.json(userLeads.map((l: any) => ({ ...l, analysis: l.analysis ? JSON.parse(l.analysis) : null })));
  });

  app.post("/api/leads", (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const { id, platform, author, content, url, timestamp, analysis } = req.body;
    db.prepare(
      "INSERT OR REPLACE INTO leads (id, userId, platform, author, content, url, timestamp, analysis) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(id, (req.user as any).id, platform, author, content, url, timestamp, JSON.stringify(analysis));
    res.json({ success: true });
  });

  app.get("/api/context", (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const context = db.prepare("SELECT * FROM brand_context WHERE userId = ?").get((req.user as any).id) as any;
    if (context) {
      res.json({ ...context, audienceSegments: JSON.parse(context.audienceSegments) });
    } else {
      res.json(null);
    }
  });

  app.post("/api/context", (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const { websiteUrl, productName, productDescription, audienceSegments } = req.body;
    db.prepare(
      "INSERT OR REPLACE INTO brand_context (userId, websiteUrl, productName, productDescription, audienceSegments) VALUES (?, ?, ?, ?, ?)"
    ).run((req.user as any).id, websiteUrl, productName, productDescription, JSON.stringify(audienceSegments));
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
