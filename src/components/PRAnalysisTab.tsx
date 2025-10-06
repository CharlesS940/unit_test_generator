"use client";

import React, { useState } from "react";

interface PRAnalysisTabProps {
  testOutput: string;
  isLoading: boolean;
  error: string;
  onTestsGenerated: (tests: string) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (error: string) => void;
}

export default function PRAnalysisTab({
  testOutput,
  isLoading,
  error,
  onTestsGenerated,
  onLoadingChange,
  onError
}: PRAnalysisTabProps) {
  const [prUrl, setPrUrl] = useState("");

  const analyzeAndGenerateTests = async () => {
    if (!prUrl || prUrl.trim() === "") {
      onError("Please enter a PR URL first!");
      return;
    }

    onLoadingChange(true);
    onError("");

    try {
      const response = await fetch('/api/generate-tests-from-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prUrl })
      });

      const data = await response.json();

      if (!response.ok) {
        onError(data.error || 'Failed to analyze PR and generate tests');
      } else {
        onTestsGenerated(data.tests);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, width: "100%" }}>
      {/* PR URL Input Section */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
        <label style={{ fontWeight: "bold", fontSize: 18 }}>
          Enter GitHub Pull Request URL:
        </label>
        <div style={{ display: "flex", gap: 16, alignItems: "center", width: "100%", maxWidth: 800 }}>
          <input
            type="text"
            value={prUrl}
            onChange={(e) => setPrUrl(e.target.value)}
            placeholder="https://github.com/owner/repo/pull/123"
            style={{
              flex: 1,
              padding: "12px 16px",
              fontSize: 16,
              borderRadius: 6,
              border: "lightgray solid 1px",
              outline: "none",
              fontFamily: "monospace"
            }}
          />
          <button
            onClick={analyzeAndGenerateTests}
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
              minWidth: 140
            }}
          >
            {isLoading ? "Analyzing..." : "Analyze & Generate"}
          </button>
        </div>
        
        {error && (
          <div style={{ 
            color: "#ff4444", 
            fontSize: 14, 
            textAlign: "center",
            maxWidth: 600,
            wordWrap: "break-word"
          }}>
            {error}
          </div>
        )}
      </div>

      {testOutput && (
        <div style={{ width: "100%", maxWidth: 1000 }}>
          <label style={{ fontWeight: "bold", marginBottom: 16, display: "block", fontSize: 18 }}>
            Generated Tests:
          </label>
          <div style={{
            backgroundColor: "#f8f9fa",
            padding: 24,
            borderRadius: 8,
            border: "1px solid #e1e4e8",
            fontFamily: "monospace",
            fontSize: 14,
            lineHeight: 1.5,
            whiteSpace: "pre-line",
            overflow: "auto",
            maxHeight: "600px"
          }}>
            {testOutput}
          </div>
        </div>
      )}
    </div>
  );
}