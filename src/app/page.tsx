"use client";

import React, { useState } from "react";
import ManualCodeTab from "@/components/ManualCodeTab";
import PRAnalysisTab from "@/components/PRAnalysisTab";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'manual' | 'pr'>('manual');
  const [testOutput, setTestOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTestsGenerated = (tests: string) => {
    setTestOutput(tests);
  };

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
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
      
      <div style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setActiveTab('manual')}
          style={{
            padding: "12px 24px",
            fontSize: 16,
            fontWeight: "bold",
            backgroundColor: activeTab === 'manual' ? "#007acc" : "#f0f0f0",
            color: activeTab === 'manual' ? "white" : "#333",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          Manual Code Input
        </button>
        <button
          onClick={() => setActiveTab('pr')}
          style={{
            padding: "12px 24px",
            fontSize: 16,
            fontWeight: "bold",
            backgroundColor: activeTab === 'pr' ? "#007acc" : "#f0f0f0",
            color: activeTab === 'pr' ? "white" : "#333",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          GitHub PR Analysis
        </button>
      </div>

      {activeTab === 'manual' ? (
        <ManualCodeTab
          testOutput={testOutput}
          isLoading={isLoading}
          error={error}
          onTestsGenerated={handleTestsGenerated}
          onLoadingChange={handleLoadingChange}
          onError={handleError}
        />
      ) : (
        <PRAnalysisTab
          testOutput={testOutput}
          isLoading={isLoading}
          error={error}
          onTestsGenerated={handleTestsGenerated}
          onLoadingChange={handleLoadingChange}
          onError={handleError}
        />
      )}
    </div>
  );
}