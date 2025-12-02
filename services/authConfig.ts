import { Configuration, PopupRequest } from "@azure/msal-browser";

// Check if Env vars are set (Vite uses import.meta.env)
const CLIENT_ID = (import.meta as any).env.VITE_AZURE_CLIENT_ID;
const TENANT_ID = (import.meta as any).env.VITE_AZURE_TENANT_ID || "common";

export const isMsalConfigured = !!CLIENT_ID;

export const msalConfig: Configuration = {
    auth: {
        clientId: CLIENT_ID || "placeholder-id", // Fallback to avoid crash if missing
        authority: `https://login.microsoftonline.com/${TENANT_ID}`,
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: PopupRequest = {
    scopes: ["User.Read"]
};

// Graph Config (Optional, for future profile picture fetching)
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};