import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  // STRICT DEVELOPMENT-ONLY SAFEGUARD
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Find all available environment files
  const filesToCheck = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.development.local'
  ];

  const filesData = {};
  let defaultFile = '';

  // Helper to parse env content into key-value items
  const parseEnvContent = (content) => {
    if (!content) return [];
    const lines = content.split(/\r?\n/);
    return lines.map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return { type: 'empty', raw: line };
      }
      if (trimmed.startsWith('#')) {
        return { type: 'comment', value: trimmed, raw: line };
      }
      
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1];
        let value = match[2];
        
        // Strip surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        const lowercaseKey = key.toLowerCase();
        const isSecret = lowercaseKey.includes('secret') || 
                         lowercaseKey.includes('key') || 
                         lowercaseKey.includes('token') || 
                         lowercaseKey.includes('password') || 
                         lowercaseKey.includes('auth');
                         
        return { type: 'kv', key, value, isSecret, raw: line };
      }
      
      return { type: 'other', raw: line };
    });
  };

  // Read environment files
  for (const filename of filesToCheck) {
    const filePath = path.join(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        filesData[filename] = {
          raw: content,
          parsed: parseEnvContent(content)
        };
        if (!defaultFile) {
          defaultFile = filename;
        }
      } catch (err) {
        console.error(`Error reading ${filename}:`, err);
      }
    }
  }

  // Add Active process.env as a virtual file
  const activeEnvKeys = Object.keys(process.env).sort();
  const activeEnvRaw = activeEnvKeys
    .map(key => `${key}=${process.env[key]}`)
    .join('\n');
    
  const activeEnvParsed = activeEnvKeys.map(key => {
    const value = process.env[key] || '';
    const lowercaseKey = key.toLowerCase();
    const isSecret = lowercaseKey.includes('secret') || 
                     lowercaseKey.includes('key') || 
                     lowercaseKey.includes('token') || 
                     lowercaseKey.includes('password') || 
                     lowercaseKey.includes('auth');
    return {
      type: 'kv',
      key,
      value,
      isSecret,
      raw: `${key}=${value}`
    };
  });

  filesData['Active process.env'] = {
    raw: activeEnvRaw,
    parsed: activeEnvParsed
  };

  if (!defaultFile) {
    defaultFile = 'Active process.env';
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Svay • Development Env Console</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #09090b;
      --card-bg: rgba(20, 20, 25, 0.7);
      --card-border: rgba(255, 255, 255, 0.08);
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
      --primary: #8b5cf6;
      --primary-hover: #7c3aed;
      --primary-glow: rgba(139, 92, 246, 0.15);
      --secondary: #06b6d4;
      --accent: #ec4899;
      --success: #10b981;
      --font-sans: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      overflow-x: hidden;
      background-image: 
        radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.1) 0px, transparent 50%),
        radial-gradient(at 50% 100%, rgba(236, 72, 153, 0.05) 0px, transparent 50%);
      background-attachment: fixed;
    }
    
    header {
      padding: 2rem;
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--card-border);
    }
    
    .logo-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .logo-badge {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      font-weight: 700;
      letter-spacing: 1px;
      font-size: 0.9rem;
      box-shadow: 0 4px 20px var(--primary-glow);
    }
    
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(to right, #ffffff, #d1d5db);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .dev-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: var(--success);
      padding: 0.5rem 1rem;
      border-radius: 2rem;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      }
    }
    
    main {
      max-width: 1280px;
      margin: 2rem auto;
      padding: 0 2rem 4rem;
    }
    
    .control-panel {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    
    .selector-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .label {
      font-size: 0.9rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    
    .file-select-wrapper {
      position: relative;
    }
    
    .file-selector {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 0.6rem 2.5rem 0.6rem 1rem;
      border-radius: 0.5rem;
      font-family: var(--font-sans);
      font-size: 0.9rem;
      font-weight: 500;
      outline: none;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a1a1aa'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 1rem;
      transition: all 0.2s;
      min-width: 220px;
    }
    
    .file-selector:hover {
      border-color: rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.03);
    }
    
    .file-selector:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--primary-glow);
    }
    
    .view-toggle {
      display: flex;
      gap: 0.25rem;
      background: rgba(255, 255, 255, 0.03);
      padding: 0.25rem;
      border-radius: 0.5rem;
      border: 1px solid var(--card-border);
    }
    
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.45rem 1rem;
      font-family: var(--font-sans);
      font-weight: 500;
      font-size: 0.85rem;
      cursor: pointer;
      border-radius: 0.375rem;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    
    .tab-btn:hover {
      color: var(--text);
    }
    
    .tab-btn.active {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid var(--card-border);
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      flex-wrap: wrap;
    }
    
    .search-container {
      position: relative;
      flex-grow: 1;
      max-width: 360px;
    }
    
    .search-input {
      width: 100%;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 0.55rem 1rem 0.55rem 2.25rem;
      border-radius: 0.5rem;
      font-family: var(--font-sans);
      font-size: 0.875rem;
      outline: none;
      transition: all 0.2s;
    }
    
    .search-input:focus {
      border-color: var(--primary);
      background: rgba(0, 0, 0, 0.4);
      box-shadow: 0 0 0 2px var(--primary-glow);
    }
    
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }
    
    .btn-group {
      display: flex;
      gap: 0.75rem;
    }
    
    .btn {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 0.45rem 0.85rem;
      border-radius: 0.5rem;
      font-family: var(--font-sans);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
      box-shadow: 0 4px 12px var(--primary-glow);
    }
    
    .btn:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }
    
    .btn-secondary {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--card-border);
      color: var(--text);
      box-shadow: none;
    }
    
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }
    
    .console-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 1rem;
      padding: 1.5rem;
      backdrop-filter: blur(16px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }
    
    .raw-view-wrapper {
      display: none;
    }
    
    .raw-view {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      line-height: 1.6;
      overflow-x: auto;
      white-space: pre;
      background: rgba(0, 0, 0, 0.35);
      padding: 1.5rem;
      border-radius: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.03);
      max-height: 600px;
      overflow-y: auto;
      color: #e4e4e7;
    }
    
    .grid-view {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .env-row {
      display: grid;
      grid-template-columns: 280px 1fr auto;
      align-items: center;
      gap: 1.5rem;
      padding: 0.65rem 1rem;
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.02);
      border-radius: 0.5rem;
      transition: all 0.15s ease;
    }
    
    .env-row:hover {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.06);
    }
    
    .env-row.comment {
      grid-template-columns: 1fr;
      color: #71717a;
      font-style: italic;
      background: transparent;
      border-color: transparent;
      padding-top: 0.85rem;
      padding-bottom: 0.15rem;
      font-size: 0.85rem;
    }
    
    .env-row.empty {
      grid-template-columns: 1fr;
      height: 1rem;
      background: transparent;
      border-color: transparent;
    }
    
    .env-row.other {
      grid-template-columns: 1fr;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 0.8rem;
    }
    
    .env-key-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }
    
    .env-key {
      font-family: var(--font-mono);
      font-weight: 600;
      color: #f4f4f5;
      font-size: 0.85rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .env-val-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      overflow: hidden;
      min-width: 0;
    }
    
    .env-val {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: #d4d4d8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      background: rgba(0, 0, 0, 0.25);
      padding: 0.35rem 0.6rem;
      border-radius: 0.375rem;
      border: 1px solid rgba(255, 255, 255, 0.03);
      flex-grow: 1;
      min-width: 0;
    }
    
    .env-val.masked {
      letter-spacing: 2px;
      color: #52525b;
    }
    
    .env-val.secret-border {
      border-color: rgba(236, 72, 153, 0.15);
    }
    
    .badge {
      font-size: 0.65rem;
      padding: 0.15rem 0.4rem;
      border-radius: 0.25rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      flex-shrink: 0;
    }
    
    .badge-secret {
      background: rgba(236, 72, 153, 0.08);
      color: var(--accent);
      border: 1px solid rgba(236, 72, 153, 0.2);
    }
    
    .badge-public {
      background: rgba(6, 182, 212, 0.08);
      color: var(--secondary);
      border: 1px solid rgba(6, 182, 212, 0.2);
    }
    
    .row-actions {
      display: flex;
      gap: 0.35rem;
      flex-shrink: 0;
    }
    
    .icon-btn {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      width: 30px;
      height: 30px;
      border-radius: 0.375rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    
    .icon-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }
    
    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: rgba(9, 9, 11, 0.95);
      border: 1px solid var(--primary);
      color: #fff;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 100;
      font-size: 0.9rem;
      pointer-events: none;
    }
    
    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }
    
    .toast svg {
      color: var(--success);
      flex-shrink: 0;
    }
    
    .search-highlight {
      background-color: rgba(139, 92, 246, 0.3);
      border-radius: 2px;
      color: white;
    }

    /* Scrollbars styling */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Responsive Media Queries */
    @media (max-width: 900px) {
      .env-row {
        grid-template-columns: 240px 1fr auto;
        gap: 1rem;
      }
    }

    @media (max-width: 768px) {
      header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        padding: 1.5rem 1rem;
      }
      
      .logo-container {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
      
      .header-right {
        width: 100%;
      }
      
      .dev-indicator {
        width: 100%;
        justify-content: center;
      }

      .control-panel {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .selector-group {
        flex-direction: column;
        align-items: stretch;
      }

      .file-select-wrapper, .file-selector {
        width: 100%;
      }

      .view-toggle {
        width: 100%;
      }

      .view-toggle .tab-btn {
        flex: 1;
        justify-content: center;
      }

      .actions-bar {
        flex-direction: column;
        align-items: stretch;
        padding: 1rem;
        gap: 0.75rem;
      }

      .search-container {
        max-width: 100%;
      }

      .btn-group {
        justify-content: space-between;
        gap: 0.5rem;
      }

      .btn-group .btn {
        flex: 1;
        justify-content: center;
      }

      .env-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
        padding: 1rem;
        align-items: stretch;
      }
      
      .env-key-container {
        justify-content: space-between;
      }
      
      .row-actions {
        justify-content: flex-end;
        margin-top: 0.5rem;
      }
    }
  </style>
</head>
<body>

  <header>
    <div class="logo-container">
      <div class="logo-badge">SVAY</div>
      <div>
        <h1>Development Env Console</h1>
        <div class="subtitle">Quickly copy local configuration for your workspaces</div>
      </div>
    </div>
    <div class="header-right">
      <div class="dev-indicator">
        <span class="pulse-dot"></span>
        Development Mode Only
      </div>
    </div>
  </header>

  <main>
    <div class="control-panel">
      <div class="selector-group">
        <span class="label">Select Config Source:</span>
        <div class="file-select-wrapper">
          <select id="file-selector" class="file-selector" onchange="onSourceChange(this.value)">
            <!-- Options will be populated dynamically -->
          </select>
        </div>
      </div>
      
      <div class="view-toggle">
        <button id="view-grid-btn" class="tab-btn active" onclick="setView('grid')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Grid View
        </button>
        <button id="view-raw-btn" class="tab-btn" onclick="setView('raw')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Raw .env Code
        </button>
      </div>
    </div>

    <div class="actions-bar">
      <div class="search-container">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" id="search-input" class="search-input" placeholder="Search variables or values..." oninput="filterEnv()">
      </div>
      
      <div class="btn-group">
        <button id="reveal-all-btn" class="btn btn-secondary" onclick="toggleRevealAll()">
          Reveal
        </button>
        <button class="btn" onclick="copyEntireSource()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          Copy
        </button>
      </div>
    </div>

    <div class="console-card">
      <div id="grid-container" class="grid-view">
        <!-- Rendered dynamically -->
      </div>
      
      <div id="raw-view-container" class="raw-view-wrapper">
        <pre id="raw-container" class="raw-view"></pre>
      </div>
    </div>
  </main>

  <div id="toast" class="toast">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span id="toast-message">Copied to clipboard!</span>
  </div>

  <script>
    // Embedded JSON data of the variables parsed by Next server
    const filesData = ${JSON.stringify(filesData)};
    let currentFile = "${defaultFile}";
    let allRevealed = false;
    let currentViewMode = 'grid';

    // Populate Selector Dropdown
    const selector = document.getElementById('file-selector');
    Object.keys(filesData).forEach(filename => {
      const option = document.createElement('option');
      option.value = filename;
      option.textContent = filename;
      if (filename === currentFile) {
        option.selected = true;
      }
      selector.appendChild(option);
    });

    // Handle source file change
    function onSourceChange(filename) {
      currentFile = filename;
      allRevealed = false;
      document.getElementById('reveal-all-btn').textContent = 'Reveal';
      document.getElementById('search-input').value = '';
      
      // Update Copy Entire File label
      const copyBtn = document.querySelector('.btn-group .btn:not(.btn-secondary)');
      if (filename === 'Active process.env') {
        copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg> Copy';
      } else {
        copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg> Copy';
      }
      
      renderFileContent();
    }

    // Toggle reveal state for a single secret
    function toggleReveal(index) {
      const item = filesData[currentFile].parsed[index];
      const valEl = document.getElementById('val-' + index);
      const btnEl = document.getElementById('reveal-btn-' + index);
      const isMasked = valEl.classList.contains('masked');
      
      if (isMasked) {
        valEl.textContent = item.value;
        valEl.classList.remove('masked');
        btnEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18M10.584 10.584a3 3 0 114.243 4.243m-7.3-7.3A10.003 10.003 0 0012 19c4.478 0 8.268-2.943 9.543-7a9.97 9.97 0 00-1.563-3.029m-5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242" /></svg>';
      } else {
        valEl.textContent = '••••••••••••••••';
        valEl.classList.add('masked');
        btnEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>';
      }
    }

    // Toggle reveal state for all secrets
    function toggleRevealAll() {
      allRevealed = !allRevealed;
      const fileData = filesData[currentFile];
      if (!fileData.parsed) return;
      
      fileData.parsed.forEach((item, index) => {
        if (item.type === 'kv' && item.isSecret) {
          const valEl = document.getElementById('val-' + index);
          const btnEl = document.getElementById('reveal-btn-' + index);
          if (valEl && btnEl) {
            if (allRevealed) {
              valEl.textContent = item.value;
              valEl.classList.remove('masked');
              btnEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18M10.584 10.584a3 3 0 114.243 4.243m-7.3-7.3A10.003 10.003 0 0012 19c4.478 0 8.268-2.943 9.543-7a9.97 9.97 0 00-1.563-3.029m-5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242" /></svg>';
            } else {
              valEl.textContent = '••••••••••••••••';
              valEl.classList.add('masked');
              btnEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>';
            }
          }
        }
      });
      
      document.getElementById('reveal-all-btn').textContent = allRevealed ? 'Hide' : 'Reveal';
    }

    // Clipboard Copy Helper
    function copyToClipboard(text, message = 'Copied to clipboard!') {
      navigator.clipboard.writeText(text).then(() => {
        showToast(message);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }

    // Copy single value
    function copyValue(index) {
      const item = filesData[currentFile].parsed[index];
      copyToClipboard(item.value, 'Copied value for ' + item.key + '!');
    }

    // Copy single declaration key=value
    function copyDeclaration(index) {
      const item = filesData[currentFile].parsed[index];
      copyToClipboard(item.key + '=' + item.value, 'Copied declaration for ' + item.key + '!');
    }

    // Copy entire file raw contents
    function copyEntireSource() {
      const isProcess = currentFile === 'Active process.env';
      copyToClipboard(
        filesData[currentFile].raw, 
        isProcess ? 'Copied all active variables!' : 'Copied entire file contents!'
      );
    }

    // Show copy feedback toast
    let toastTimeout;
    function showToast(message) {
      const toast = document.getElementById('toast');
      const toastMsg = document.getElementById('toast-message');
      toastMsg.textContent = message;
      toast.classList.add('show');
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
      }, 2200);
    }

    // Set view mode (grid / raw)
    function setView(mode) {
      currentViewMode = mode;
      const gridContainer = document.getElementById('grid-container');
      const rawContainer = document.getElementById('raw-view-container');
      const gridBtn = document.getElementById('view-grid-btn');
      const rawBtn = document.getElementById('view-raw-btn');
      
      if (mode === 'grid') {
        gridContainer.style.display = 'flex';
        rawContainer.style.display = 'none';
        gridBtn.classList.add('active');
        rawBtn.classList.remove('active');
      } else {
        gridContainer.style.display = 'none';
        rawContainer.style.display = 'block';
        gridBtn.classList.remove('active');
        rawBtn.classList.add('active');
      }
    }

    // Render contents of selected source
    function renderFileContent() {
      const fileData = filesData[currentFile];
      
      // Update Raw text
      document.getElementById('raw-container').textContent = fileData.raw;
      
      // Update Grid table
      const gridContainer = document.getElementById('grid-container');
      gridContainer.innerHTML = '';
      
      if (fileData.parsed && fileData.parsed.length > 0) {
        fileData.parsed.forEach((item, index) => {
          const row = document.createElement('div');
          
          if (item.type === 'empty') {
            row.className = 'env-row empty';
          } else if (item.type === 'comment') {
            row.className = 'env-row comment';
            row.textContent = item.value;
          } else if (item.type === 'kv') {
            row.className = 'env-row';
            row.setAttribute('data-key', item.key);
            row.setAttribute('data-val', item.value);
            
            const badgeClass = item.isSecret ? 'badge badge-secret' : 'badge badge-public';
            const badgeText = item.isSecret ? 'secret' : 'public';
            
            const valId = 'val-' + index;
            const revealBtnId = 'reveal-btn-' + index;
            
            let valueDisplay = item.value;
            let isMasked = false;
            if (item.isSecret) {
              valueDisplay = '••••••••••••••••';
              isMasked = true;
            }
            
            let innerHTML = '';
            innerHTML += '<div class="env-key-container">';
            innerHTML += '  <span class="env-key" title="' + escapeHtml(item.key) + '">' + escapeHtml(item.key) + '</span>';
            innerHTML += '  <span class="' + badgeClass + '">' + badgeText + '</span>';
            innerHTML += '</div>';
            innerHTML += '<div class="env-val-container">';
            innerHTML += '  <div id="' + valId + '" class="env-val ' + (isMasked ? 'masked' : '') + ' ' + (item.isSecret ? 'secret-border' : '') + '">' + escapeHtml(valueDisplay) + '</div>';
            innerHTML += '</div>';
            innerHTML += '<div class="row-actions">';
            if (item.isSecret) {
              innerHTML += '  <button id="' + revealBtnId + '" class="icon-btn" onclick="toggleReveal(' + index + ')" title="Reveal/Hide Value">';
              innerHTML += '    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">';
              innerHTML += '      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />';
              innerHTML += '      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
              innerHTML += '    </svg>';
              innerHTML += '  </button>';
            }
            innerHTML += '  <button class="icon-btn" onclick="copyValue(' + index + ')" title="Copy Value Only">';
            innerHTML += '    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">';
            innerHTML += '      <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />';
            innerHTML += '    </svg>';
            innerHTML += '  </button>';
            innerHTML += '  <button class="icon-btn" onclick="copyDeclaration(' + index + ')" title="Copy KEY=VALUE Line">';
            innerHTML += '    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">';
            innerHTML += '      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />';
            innerHTML += '    </svg>';
            innerHTML += '  </button>';
            innerHTML += '</div>';
            
            row.innerHTML = innerHTML;
          } else {
            row.className = 'env-row other';
            row.textContent = item.raw;
          }
          gridContainer.appendChild(row);
        });
      } else {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.padding = '3rem 2rem';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = 'var(--text-muted)';
        emptyMsg.textContent = 'No variables found in this configuration.';
        gridContainer.appendChild(emptyMsg);
      }
    }

    // Filter env rows based on search input
    function filterEnv() {
      const query = document.getElementById('search-input').value.trim().toLowerCase();
      const rows = document.querySelectorAll('.env-row');
      
      rows.forEach(row => {
        if (row.classList.contains('comment') || row.classList.contains('empty')) {
          row.style.display = query ? 'none' : '';
          return;
        }
        
        if (row.classList.contains('other')) {
          const raw = row.textContent.toLowerCase();
          row.style.display = raw.includes(query) ? '' : 'none';
          return;
        }
        
        const key = row.getAttribute('data-key').toLowerCase();
        const val = row.getAttribute('data-val').toLowerCase();
        
        if (key.includes(query) || val.includes(query)) {
          row.style.display = '';
          
          // Highlight key match if searched
          const keyEl = row.querySelector('.env-key');
          const originalKey = row.getAttribute('data-key');
          if (query && originalKey.toLowerCase().includes(query)) {
            const regex = new RegExp('(' + query + ')', 'gi');
            keyEl.innerHTML = originalKey.replace(regex, '<span class="search-highlight">$1</span>');
          } else {
            keyEl.textContent = originalKey;
          }
        } else {
          row.style.display = 'none';
        }
      });
    }

    // Helpers
    function escapeHtml(str) {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // Initial render
    renderFileContent();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
