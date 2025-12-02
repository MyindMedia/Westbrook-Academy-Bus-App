
import { loginRequest } from "./authConfig";

export const getGraphToken = async (instance: any, accounts: any[]) => {
    const request = {
        ...loginRequest,
        account: accounts[0],
    };

    try {
        const response = await instance.acquireTokenSilent(request);
        return response.accessToken;
    } catch (e) {
        try {
            const response = await instance.acquireTokenPopup(request);
            return response.accessToken;
        } catch (e) {
            console.error(e);
            return null;
        }
    }
};

export const getGraphProfilePhoto = async (accessToken: string): Promise<string | null> => {
    try {
        const response = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            return null; // No photo exists or error
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Error fetching photo", error);
        return null;
    }
};
