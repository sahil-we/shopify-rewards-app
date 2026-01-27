// app/routes/app.addpoints.jsx

import { useState } from "react";

export default function AddPoints() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleClick = async () => {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/addpoints", { method: "POST" });
    const data = await res.json();

    setResult(data);
    setLoading(false);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Add Employee Points</h2>

      <button onClick={handleClick} disabled={loading}>
        {loading ? "Processing..." : "Add 100 Points"}
      </button>

      {result && (
        <pre style={{ marginTop: 20 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
