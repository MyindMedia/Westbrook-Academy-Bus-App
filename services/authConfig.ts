import { Configuration, PopupRequest } from "@azure/msal-browser";

// Safely access env vars
const getEnv = (key: string) => {
  try {
    return (import.meta as any).env?.[key];
  } catch (e) {
    return undefined;
  }
};

// Use provided IDs as defaults so it works without .env in the preview
const CLIENT_ID = getEnv("VITE_AZURE_CLIENT_ID") || "a92468c8-fec7-4fcf-82ee-c27c80f6fb66";
const TENANT_ID = getEnv("VITE_AZURE_TENANT_ID") || "afc1d09c-9f9b-4d45-9643-198f7dc264c4";

// Check if we have a valid client ID (not empty)
export const isMsalConfigured = !!CLIENT_ID && CLIENT_ID.length > 0;

export const msalConfig: Configuration = {
    auth: {
        clientId: CLIENT_ID,
        authority: `https://login.microsoftonline.com/${TENANT_ID}`,
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
};

export const loginRequest: PopupRequest = {
    scopes: ["User.Read"]
};

export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};