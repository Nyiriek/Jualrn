import React, { useEffect } from "react";

const ChatbotEmbed: React.FC = () => {
  useEffect(() => {
    // Only inject once
    if (!document.querySelector('script[src="https://static.elfsight.com/platform/platform.js"]')) {
      const script = document.createElement("script");
      script.src = "https://static.elfsight.com/platform/platform.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div
      className="elfsight-app-ecc98ea6-5819-4638-9f31-045d786c2422"
      data-elfsight-app-lazy
      style={{
        position: "fixed",
        bottom: "30px",
        right: "30px",
        zIndex: 9999,
      }}
    />
  );
};

export default ChatbotEmbed;
