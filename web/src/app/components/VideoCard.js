"use client";

import { useState, useEffect } from "react";
import { calculateViralityScore } from "@/lib/ranking/virality";
import { Bookmark, Save } from "lucide-react";
import ResearchNotesModal from "./ResearchNotesModal";

export default function VideoCard({ item, setHoverInfo, setSelectedVideo, formatNumber }) {
  const [color, setColor] = useState("0, 112, 243"); // Default blue
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const v = calculateViralityScore(item);

  useEffect(() => {
    const thumbUrl = item.snippet.thumbnails.medium.url;
    if (!thumbUrl) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = thumbUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width = 1;
        canvas.height = 1;
        
        // Draw center of the image to avoid black bars
        ctx.drawImage(img, img.width / 4, img.height / 4, img.width / 2, img.height / 2, 0, 0, 1, 1);
        
        const imageData = ctx.getImageData(0, 0, 1, 1).data;
        let [r, g, b] = imageData;

        // Enhance color: ensure it's not too dark or too desaturated
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness < 60) {
          const factor = 60 / (brightness || 1);
          r = Math.min(255, Math.round(r * factor + 20));
          g = Math.min(255, Math.round(g * factor + 20));
          b = Math.min(255, Math.round(b * factor + 20));
        }

        setColor(`${r}, ${g}, ${b}`);
      } catch (e) {
        console.warn("Color extraction failed for", thumbUrl, e);
      }
    };
  }, [item.snippet.thumbnails.medium.url]);

  return (
    <div 
      className="group relative border flex flex-col md:flex-row min-h-[18rem] rounded-[2rem] overflow-hidden transition-all duration-500 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 bg-[rgba(var(--card-color),0.03)] hover:bg-[rgba(var(--card-color),0.12)] border-[rgba(var(--card-color),0.25)] hover:border-[rgba(var(--card-color),0.5)]"
      style={{ 
        "--card-color": color,
        boxShadow: `0 0 80px rgba(${color}, 0.08)`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 20px 80px rgba(${color}, 0.15)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 0 80px rgba(${color}, 0.08)`;
      }}
    >
      {/* Background Glow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"
        style={{ 
          background: `radial-gradient(circle at 30% 50%, rgba(${color}, 0.4), transparent 80%)`
        }}
      ></div>

      <div className="relative md:w-[24rem] h-48 md:h-auto flex-shrink-0 overflow-hidden">
        <img 
          src={item.snippet.thumbnails.medium.url} 
          alt="" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
        <div className="absolute bottom-6 left-6 flex flex-col gap-2">
           <div 
            onMouseEnter={() => setHoverInfo({ 
              title: `${v.level} Status (Score: ${v.score})`, 
              text: `How well this video is performing based on daily views (${formatNumber(v.dailyViews)}/day) and engagement (${v.engagement}%).` 
            })} 
            onMouseLeave={() => setHoverInfo(null)} 
            className={`bg-gradient-to-r ${v.color} text-white px-4 py-1.5 rounded-xl font-black text-[10px] tracking-[0.2em] uppercase shadow-2xl cursor-help flex items-center gap-3`}
           >
              <span>{v.level}</span>
              <span className="w-px h-3 bg-white/30"></span>
              <span className="opacity-90">{v.score}</span>
           </div>
        </div>
      </div>

      <div className="p-6 md:p-10 flex-1 flex flex-col overflow-hidden relative z-10">
        <div className="flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-8 mb-4">
            <h3 
              className="font-black text-xl md:text-3xl tracking-tighter leading-[1.1] transition-colors line-clamp-2 text-[#ededed]" 
              style={{ color: `rgba(255, 255, 255, 0.9)` }}
              dangerouslySetInnerHTML={{ __html: item.snippet.title }}
            ></h3>
            {item.distance !== undefined && !isNaN(item.distance) && (
              <span 
                onMouseEnter={() => setHoverInfo({ title: "Search Match", text: "How well this video matches your search." })} 
                onMouseLeave={() => setHoverInfo(null)} 
                className="shrink-0 text-[10px] font-black px-3 py-1.5 rounded-full tracking-widest cursor-help border transition-colors whitespace-nowrap"
                style={{ 
                  backgroundColor: `rgba(${color}, 0.15)`, 
                  color: `white`,
                  borderColor: `rgba(${color}, 0.4)`
                }}
              >
                MATCH {(item.distance * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#666666] mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
            <span className="text-white truncate max-w-[120px] md:max-w-none">{item.snippet.channelTitle}</span>
            <span className="w-1 h-1 bg-[#333333] rounded-full"></span>
            <span>{new Date(item.snippet.publishedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
          </p>
          <p className="text-xs md:text-sm text-[#888888] line-clamp-2 font-medium leading-relaxed mb-6 md:mb-8 group-hover:text-[#eeeeee] transition-colors">{item.snippet.description}</p>
        </div>
        
        <div className="mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-white/5 pt-6 md:pt-8 gap-6 md:gap-8">
           <div className="flex gap-6 md:gap-12 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#444444] font-black uppercase tracking-widest mb-1">Views per Day</span>
                <span className="text-lg md:text-xl font-black text-white tracking-tighter">{formatNumber(v.dailyViews)}<span className="text-[10px] text-[#666666] ml-1">/D</span></span>
              </div>
              <div 
                onMouseEnter={() => setHoverInfo({ title: "Engagement", text: "Likes and comments compared to views." })} 
                onMouseLeave={() => setHoverInfo(null)} 
                className="flex flex-col cursor-help"
              >
                <span className="text-[10px] text-[#444444] font-black uppercase tracking-widest mb-1">Engagement</span>
                <span className="text-lg md:text-xl font-black text-white tracking-tighter" style={{ color: `rgba(${color}, 1)` }}>{v.engagement}<span className="text-[10px] text-[#666666] ml-1">%</span></span>
              </div>
           </div>
           <div className="flex gap-4 w-full sm:w-auto">
              <button 
                onClick={() => setIsNotesModalOpen(true)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group/save"
              >
                <Save className="w-5 h-5 text-zinc-500 group-hover/save:text-white transition-colors" />
              </button>
              <button 
                onClick={() => setSelectedVideo({ item, v, dominantColor: color })} 
                className="flex-1 sm:flex-none sm:w-auto text-[10px] font-black tracking-[0.2em] uppercase bg-white text-black px-4 sm:px-8 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl hover:bg-[rgba(var(--card-color),1)] hover:text-white"
                style={{ boxShadow: `0 10px 30px rgba(${color}, 0.3)` }}
              >
                View Details
              </button>
           </div>
        </div>
      </div>

      <ResearchNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        item={{
          id: item.id.videoId || item.id,
          type: 'video',
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          metadata: {
            thumbnail: item.snippet.thumbnails.medium.url,
            channelId: item.snippet.channelId,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            statistics: item.statistics || {},
            vScore: v.score
          }
        }}
      />
    </div>
  );
}
