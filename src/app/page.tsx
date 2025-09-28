"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function CodeInput() {
  const [code, setCode] = useState("Paste your code here...");
  const [testOutput, setTestOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const generateTests = async () => {
    if (!code || code.trim() === "" || code === "Paste your code here...") {
      setError("Please enter some code first!");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: code,
          language: 'python' 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate tests');
      } else {
        setTestOutput(data.tests);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  
  };

  return (
    <div
      style={{
        maxWidth: 1600,
        margin: "0 auto",
        padding: 48,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h1 style={{ fontSize: 40, fontWeight: "bold", marginBottom: 32, textAlign: "center" }}>
        Unit Test Generator
      </h1>
      <div style={{ display: "flex", gap: 32, width: "100%" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <label style={{ fontWeight: "bold", marginBottom: 8 }}>Code to test:</label>
          <MonacoEditor
            height="750px"
            defaultLanguage="python"
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{ fontSize: 16 }}
          />
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 16 }}>
          <button
            onClick={generateTests}
            disabled={isLoading}
            style={{
              padding: "12px 24px",
              fontSize: 16,
              fontWeight: "bold",
              backgroundColor: isLoading ? "#ccc" : "#007acc",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: isLoading ? "not-allowed" : "pointer",
              minWidth: 120
            }}
          >
            {isLoading ? "Generating..." : "Generate Tests"}
          </button>
          
          {error && (
            <div style={{ 
              color: "#ff4444", 
              fontSize: 14, 
              textAlign: "center",
              maxWidth: 200,
              wordWrap: "break-word"
            }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <label style={{ fontWeight: "bold", marginBottom: 8 }}>Generated tests:</label>
          <MonacoEditor
            height="750px"
            defaultLanguage="python"
            value={testOutput}
            options={{ readOnly: true, fontSize: 16, minimap: { enabled: false } }}
          />
        </div>
      </div>
    </div>
  );
}