"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function CodeInput() {
  const [code, setCode] = useState("");
  const [testOutput, setTestOutput] = useState("");

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
          <label style={{ fontWeight: "bold", marginBottom: 8 }}>Paste your code:</label>
          <MonacoEditor
            height="750px"
            defaultLanguage="python"
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{ fontSize: 16 }}
          />
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