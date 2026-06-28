'use client';

export default function DemoLoginButton({ label = "Explore with Demo Account", className = "" }) {
  const enterDemo = () => {
    document.cookie = "demo_mode=true; path=/; max-age=31536000;"; // 1 year
    window.location.reload();
  };

  return (
    <button 
      onClick={enterDemo}
      className={className || "mt-6 w-full bg-gradient-to-r from-geist-success/80 to-[#00f0ff]/80 hover:from-geist-success hover:to-[#00f0ff] text-black font-bold py-3 px-6 rounded-xl active:scale-[0.98] transition-all text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_25px_rgba(0,240,255,0.3)] cursor-pointer border border-white/10"}
    >
      {label}
    </button>
  );
}

