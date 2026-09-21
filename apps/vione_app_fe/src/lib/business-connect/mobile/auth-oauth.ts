// Helper functions for Google GIS and Apple Web Sign-In OAuth

export const loginGoogleWeb = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id";

    const initializeGis = () => {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: "popup",
          callback: (res: any) => {
            if (res.credential) {
              resolve(res.credential);
            } else {
              reject(new Error("No credential returned from Google"));
            }
          },
        });

        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            const btn = document.getElementById("hidden-google-btn")?.querySelector("div");
            if (btn) btn.click();
          }
        });
      } catch (err) {
        reject(err);
      }
    };

    if ((window as any).google?.accounts?.id) {
      initializeGis();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGis;
    script.onerror = () => reject(new Error("Failed to load Google GIS SDK"));
    document.head.appendChild(script);
  });
};

export const loginAppleWeb = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_APPLE_CLIENT_ID || "your-apple-client-id";

    const initializeApple = () => {
      try {
        (window as any).AppleID.auth.init({
          clientId,
          scope: "name email",
          redirectURI: window.location.origin + "/auth",
          usePopup: true,
        });

        (window as any).AppleID.auth
          .signIn()
          .then((res: any) => resolve(res))
          .catch((err: any) => reject(err));
      } catch (err) {
        reject(err);
      }
    };

    if ((window as any).AppleID?.auth) {
      initializeApple();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/auth.js";
    script.async = true;
    script.defer = true;
    script.onload = initializeApple;
    script.onerror = () => reject(new Error("Failed to load Apple Sign In SDK"));
    document.head.appendChild(script);
  });
};
