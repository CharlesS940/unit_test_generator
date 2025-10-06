"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";
import { SupportedLanguage, SupportedFramework, LANGUAGE_CONFIGS, GenerateTestsRequest } from "@/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface ManualCodeTabProps {
  testOutput: string;
  isLoading: boolean;
  error: string;
  onTestsGenerated: (tests: string) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (error: string) => void;
}

export default function ManualCodeTab({
  testOutput,
  isLoading,
  error,
  onTestsGenerated,
  onLoadingChange,
  onError
}: ManualCodeTabProps) {
  const [code, setCode] = useState("Paste your code here...");
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('python');
  const [selectedFramework, setSelectedFramework] = useState<SupportedFramework>('pytest');

  const availableFrameworks = LANGUAGE_CONFIGS.find(config => config.value === selectedLanguage)?.testFramework || [];

  const generateTestsFromCode = async () => {
    if (!code || code.trim() === "" || code === "Paste your code here...") {
      onError("Please enter some code first!");
      return;
    }

    onLoadingChange(true);
    onError("");

    try {
      const requestBody: GenerateTestsRequest = {
        code: code,
        language: selectedLanguage,
        framework: selectedFramework
      };

      const response = await fetch('/api/generate-tests-from-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        onError(data.error || 'Failed to generate tests');
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
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 32, flexDirection: "row", marginBottom: 24, justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <label style={{ fontWeight: "bold", marginRight: 12, fontSize: 16 }}>
            Select Language:
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
            style={{
              padding: "8px 12px",
              fontSize: 16,
              borderRadius: 6,
              border: "lightgray solid 1px",
              backgroundColor: "white",
              cursor: "pointer",
              minWidth: 150
            }}
          >
            {LANGUAGE_CONFIGS.map((config) => (
              <option key={config.value} value={config.value}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: "bold", marginRight: 12, fontSize: 16 }}>
            Select Framework:
          </label>
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value as SupportedFramework)}
            style={{
              padding: "8px 12px",
              fontSize: 16,
              borderRadius: 6,
              border: "lightgray solid 1px",
              backgroundColor: "white",
              cursor: "pointer",
              minWidth: 150
            }}
          >
            {availableFrameworks.map(framework => (
              <option key={framework} value={framework}>
                {framework}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div style={{ display: "flex", gap: 32, width: "100%" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <label style={{ fontWeight: "bold", marginBottom: 8 }}>Code to test:</label>
          <MonacoEditor
            height="750px"
            language={selectedLanguage}
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{ fontSize: 16 }}
          />
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 16 }}>
          <button
            onClick={generateTestsFromCode}
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
            language={selectedLanguage}
            value={testOutput}
            options={{ readOnly: true, fontSize: 16, minimap: { enabled: false } }}
          />
        </div>
      </div>
    </div>
  );
}