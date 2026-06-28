import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'src/app/api/landing/library/notes.json');

const defaultNotes = [
  { title: "2026 Video Ideas Blueprint", content: "Focus on AI Agent team builds and low-code integrations. Competitor analysis shows high search spikes but low-quality explanations.\n\nHooks:\n- 'I let an AI run my SaaS business for 30 days...'\n- 'AI Agents just killed standard web dev...'", date: "2026-06-25" },
  { title: "Competitor DNA Analysis", content: "Rivals are heavily leveraging faceless voiceovers. Channel efficiency peaks when video length is exactly 8m 15s to bypass YouTube midroll constraints.\n\nAction:\nAdd more graphics overlays and code highlights.", date: "2026-06-22" },
  { title: "Shorts Psychological Hooks", content: "Analysis of hot shorts shows two key anchors:\n1. Direct visual disruption within first 0.8s\n2. Open-loop paradox statement ('Here is why I fired my best developer').", date: "2026-06-18" }
];

function getNotes() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading notes file", e);
  }
  return defaultNotes;
}

function saveNotes(data) {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error("Error writing notes file", e);
    return false;
  }
}

export async function GET() {
  const data = getNotes();
  return NextResponse.json(data);
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Expected an array of notes" }, { status: 400 });
    }
    
    saveNotes(body);
    return NextResponse.json({ success: true, notes: body });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 500 });
  }
}
