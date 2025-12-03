import express from "express";
import axios from "axios";
import crypto from "crypto";

const router = express.Router();

// --- CONFIGURATION ---
// IMPORTANT: For local development, the Redirect URI must match what is in your PowerSchool Plugin settings.
// Usually: http://localhost:3000/api/powerschool/callback (if using Vite proxy)
// OR: http://localhost:3001/api/powerschool/callback (direct to backend)

const POWERSCHOOL_BASE_URL = process.env.POWERSCHOOL_BASE_URL || "https://lapf.powerschool.com";
const POWERSCHOOL_CLIENT_ID = process.env.POWERSCHOOL_CLIENT_ID || "38ea32b7-691b-48b1-a6cf-dfeff6ebcdd0";
const POWERSCHOOL_CLIENT_SECRET = process.env.POWERSCHOOL_CLIENT_SECRET || "b8a16e05-0e89-42c0-9ba8-602261e92c26";

// Defaulting to localhost:3000 for smoother local dev experience via proxy
const POWERSCHOOL_REDIRECT_URI = process.env.POWERSCHOOL_REDIRECT_URI || "http://localhost:3000/api/powerschool/callback";

// In production, store state and tokens in a secure database/session (Redis, Postgres, etc.)
// For this MVP, we store in memory (resets on server restart)
let lastState: string | null = null;
let lastAccessToken: string | null = null;
let lastRefreshToken: string | null = null;
let tokenExpiresAt: number = 0;

// --- DIAGNOSTICS ENDPOINT ---
router.get("/status", (req, res) => {
  const isExpired = Date.now() > tokenExpiresAt;
  
  res.json({
    status: "ok",
    backendUp: true,
    authenticated: !!lastAccessToken && !isExpired,
    tokenExists: !!lastAccessToken,
    tokenExpired: isExpired,
    config: {
      baseUrl: POWERSCHOOL_BASE_URL,
      clientIdProvided: !!POWERSCHOOL_CLIENT_ID,
      redirectUri: POWERSCHOOL_REDIRECT_URI
    }
  });
});

// 1. Start OAuth flow
router.get("/connect", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  lastState = state;

  const params = new URLSearchParams({
    client_id: POWERSCHOOL_CLIENT_ID,
    redirect_uri: POWERSCHOOL_REDIRECT_URI,
    response_type: "code",
    state,
  });

  const authUrl = `${POWERSCHOOL_BASE_URL}/oauth/authorize?${params.toString()}`;
  
  // Log for debugging
  console.log(`Initiating OAuth to: ${POWERSCHOOL_BASE_URL}`);
  console.log(`Redirect URI: ${POWERSCHOOL_REDIRECT_URI}`);
  
  res.redirect(authUrl);
});

// 2. Callback from PowerSchool
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  console.log("Received Callback from PowerSchool");

  if (!code || !state) {
    return res.status(400).send("Error: Missing code or state parameters from PowerSchool.");
  }

  try {
    const tokenUrl = `${POWERSCHOOL_BASE_URL}/oauth/token`;
    console.log(`Exchanging code for token at ${tokenUrl}...`);

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: String(code),
      client_id: POWERSCHOOL_CLIENT_ID,
      client_secret: POWERSCHOOL_CLIENT_SECRET,
      redirect_uri: POWERSCHOOL_REDIRECT_URI,
    });

    const tokenResponse = await axios.post(tokenUrl, body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    lastAccessToken = tokenResponse.data.access_token;
    lastRefreshToken = tokenResponse.data.refresh_token || null;
    
    // Set expiration (usually 3600 seconds)
    const expiresIn = tokenResponse.data.expires_in || 3600;
    tokenExpiresAt = Date.now() + (expiresIn * 1000);

    console.log("Token exchange successful!");

    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px; background-color: #f0fdf4;">
          <h1 style="color: #166534;">Connection Successful</h1>
          <p style="color: #374151;">PowerSchool has been linked successfully.</p>
          <div style="margin-top: 20px; padding: 15px; background: white; display: inline-block; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
             <p style="margin:0; font-weight:bold;">Access Token Acquired</p>
             <p style="margin:5px 0 0 0; font-size: 12px; color: #6b7280;">You can close this window now.</p>
          </div>
          <script>
            // Notify opener
            if(window.opener) {
              window.opener.postMessage({ type: 'POWERSCHOOL_CONNECTED' }, '*');
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("Token exchange error:", err.response?.data || err.message);
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; padding: 40px;">
          <h1 style="color: #dc2626;">Connection Failed</h1>
          <p>Could not exchange code for access token.</p>
          <pre style="background: #f3f4f6; padding: 15px; border-radius: 8px;">${JSON.stringify(err.response?.data || err.message, null, 2)}</pre>
          <p><strong>Check your Client Secret and Redirect URI settings.</strong></p>
        </body>
      </html>
    `);
  }
});

// Helper to refresh token
async function ensureAccessToken(): Promise<string> {
  if (lastAccessToken && Date.now() < tokenExpiresAt) {
      return lastAccessToken;
  }

  console.log("Token missing or expired. Attempting refresh...");

  if (!lastRefreshToken && !lastAccessToken) {
      throw new Error("NO_TOKEN"); // Specific error code for frontend to catch
  }

  // If we have a refresh token, try to use it
  if (lastRefreshToken) {
      try {
        const tokenUrl = `${POWERSCHOOL_BASE_URL}/oauth/token`;
        const body = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: lastRefreshToken,
            client_id: POWERSCHOOL_CLIENT_ID,
            client_secret: POWERSCHOOL_CLIENT_SECRET,
        });

        const tokenResponse = await axios.post(tokenUrl, body.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        lastAccessToken = tokenResponse.data.access_token;
        lastRefreshToken = tokenResponse.data.refresh_token || lastRefreshToken;
        const expiresIn = tokenResponse.data.expires_in || 3600;
        tokenExpiresAt = Date.now() + (expiresIn * 1000);
        
        console.log("Token refreshed successfully.");
        return lastAccessToken!;
      } catch (e) {
          console.error("Refresh failed", e);
          throw new Error("REFRESH_FAILED");
      }
  }

  throw new Error("NO_TOKEN");
}

// 3. Fetch Students
router.get("/students", async (req, res) => {
  try {
    console.log("Fetching students...");
    const token = await ensureAccessToken();

    // Fetch students
    // Note: The endpoint /ws/v1/district/student often requires specific permissions in the plugin.xml
    // Ensure <field table="STUDENTS" field="..." access="ViewOnly" /> includes what you need.
    const url = `${POWERSCHOOL_BASE_URL}/ws/v1/district/student?pagesize=100`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    console.log(`PowerSchool API Responded. Count: ${response.data.students?.student?.length || 0}`);

    // Map PowerSchool structure to App structure
    const students = response.data.students?.student?.map((s: any) => ({
      id: String(s.student_number || s.local_id || s.id),
      name: `${s.first_name} ${s.last_name}`,
      grade: parseInt(s.grade_level) || 0,
      photoUrl: `https://ui-avatars.com/api/?name=${s.first_name}+${s.last_name}&background=random&color=fff&background=2D67AA`, 
      busId: "UNASSIGNED", 
      parentPhone: s.contact?.guardian_phone || s.home_phone || "N/A"
    })) || [];

    res.json(students);
  } catch (err: any) {
    const errorMsg = err.message === "NO_TOKEN" ? "Not Authenticated" : (err.response?.data?.message || err.message);
    console.error("Student fetch error:", errorMsg);
    
    res.status(err.message === "NO_TOKEN" ? 401 : 500).json({ 
        error: "Failed to load students", 
        code: err.message,
        details: errorMsg 
    });
  }
});

export default router;