import { useEffect } from "react";

function App() {
  useEffect(() => {
    window.location.replace("/legacy/index.html");
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "linear-gradient(135deg, #120f1f 0%, #1d1630 42%, #26193a 100%)",
        color: "#f6f2ff",
        fontFamily: "system-ui, sans-serif",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: "2.5rem" }}>Launching infiNFT Monster Mayhem...</h1>
        <p style={{ marginTop: "12px", opacity: 0.8 }}>
          If you are not redirected automatically, jump straight into infiNFT Monster Mayhem.
        </p>
        <a
          href="/legacy/index.html"
          style={{
            display: "inline-block",
            marginTop: "18px",
            padding: "12px 18px",
            borderRadius: "999px",
            background: "linear-gradient(180deg, #ffe27e 0%, #f5a50c 100%)",
            color: "#2f1b00",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Launch infiNFT Monster Mayhem
        </a>
      </div>
    </main>
  );
}

export default App;
