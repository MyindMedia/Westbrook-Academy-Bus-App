import express from "express";
import axios from "axios";
import crypto from "crypto";

const router = express.Router();

// Use environment variables or fallbacks provided in prompt
const POWERSCHOOL_BASE_URL = process.env.POWERSCHOOL_BASE_URL || "https://lapf.powerschool.com";
const POWERSCHOOL_CLIENT_ID = process.env.POWERSCHOOL_CLIENT_ID || "38ea32b7-691b-48b1-a6cf-dfeff6ebcdd0";
const POWERSCHOOL_CLIENT_SECRET = process.env.POWERSCHOOL_CLIENT_SECRET || "b8a16e05-0e89-42c0-9ba8-602261e92c26";
const POWERSCHOOL_REDIRECT_URI = process.env.POWERSCHOOL_REDIRECT_URI || "https://happydadtime.com/api/powerschool/callback";

// In production, store state and tokens in a secure database/session
let lastState: string | null = null;
let lastAccessToken: string | null = null;
let lastRefreshToken: string | null = null;

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
  res.redirect(authUrl);
});

// 2. Callback from PowerSchool
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  // Basic security check
  if (!code || !state) {
    return res.status(400).send("Missing code or state");
  }

  try {
    const tokenUrl = `${POWERSCHOOL_BASE_URL}/oauth/token`;

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

    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h1 style="color: green;">Connection Successful</h1>
          <p>PowerSchool has been linked. You can close this window and return to the Westbrook App.</p>
          <script>
            // Optional: Notify opener if opened in popup
            if(window.opener) {
              window.opener.postMessage({ type: 'POWERSCHOOL_CONNECTED' }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("Token exchange error", err.response?.data || err.message);
    res.status(500).send("PowerSchool token exchange failed");
  }
});

// Helper to refresh token if needed
async function ensureAccessToken(): Promise<string> {
  if (lastAccessToken) return lastAccessToken;
  // Note: For valid flow we need a refresh token, but for first run assume we have access if successful
  // In real prod, throw if no refresh token
  if (!lastAccessToken && !lastRefreshToken) {
      throw new Error("Not authenticated. Please connect first.");
  }

  if (!lastRefreshToken) {
     return lastAccessToken!;
  }

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

  return lastAccessToken!;
}

// 3. Endpoint to fetch students
router.get("/students", async (req, res) => {
  try {
    const token = await ensureAccessToken();

    // Fetch students (example query)
    const url = `${POWERSCHOOL_BASE_URL}/ws/v1/district/student?pagesize=100`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    // Map PowerSchool structure to App structure
    const students = response.data.students?.student?.map((s: any) => ({
      id: String(s.student_number || s.id),
      name: `${s.first_name} ${s.last_name}`,
      grade: s.grade_level,
      photoUrl: `https://ui-avatars.com/api/?name=${s.first_name}+${s.last_name}&background=random`, // Placeholder
      busId: "UNASSIGNED", // Logic needed to parse transportation fields
      parentPhone: s.contact?.guardian_phone || "N/A"
    })) || [];

    res.json(students);
  } catch (err: any) {
    console.error("Student fetch error", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to load students", details: err.message });
  }
});

export default router;
