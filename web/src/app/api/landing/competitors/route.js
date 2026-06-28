import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'src/app/api/landing/competitors/competitors.json');

const defaultCompetitors = [
  { name: "Creator Lab", subs: "320K", avgViews: "85K", dna: ["Faceless", "Tutorials", "Voiceover"], velocity: "Surging (+12%)", efficiency: "0.26" },
  { name: "Future Loops", subs: "180K", avgViews: "64K", dna: ["Talking Head", "AI News", "Fast Cut"], velocity: "Stable", efficiency: "0.35" },
  { name: "Tech Digest", subs: "94K", avgViews: "12K", dna: ["Hardware reviews", "B-Roll", "Music heavy"], velocity: "Declining (-5%)", efficiency: "0.13" }
];

function getCompetitors() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading competitors file", e);
  }
  return defaultCompetitors;
}

function saveCompetitors(data) {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error("Error writing competitors file", e);
    return false;
  }
}

export async function GET() {
  const data = getCompetitors();
  return NextResponse.json(data);
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    const current = getCompetitors();
    
    const newComp = {
      name: body.name,
      subs: body.subs || `${Math.floor(Math.random() * 200 + 50)}K`,
      avgViews: body.avgViews || `${Math.floor(Math.random() * 40 + 5)}K`,
      dna: body.dna || ["Self-built", "Scraped DNA", "Unknown"],
      velocity: body.velocity || "Scanned just now",
      efficiency: body.efficiency || (Math.random() * 0.3 + 0.1).toFixed(2)
    };
    
    current.push(newComp);
    saveCompetitors(current);
    
    return NextResponse.json(current);
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 550 });
  }
}
