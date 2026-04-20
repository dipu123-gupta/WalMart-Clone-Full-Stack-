const Logo = ({ className = "h-8" }) => {
  return (
    <div className={`flex items-center gap-1.5 font-bold text-walmart-blue ${className}`}>
      <div className="relative w-8 h-8 flex items-center justify-center">
        <div className="absolute inset-0 bg-walmart-yellow rounded-full animate-pulse-slow"></div>
        <span className="relative text-white text-xl">🛒</span>
      </div>
      <span className="text-xl tracking-tight">Wal<span className="text-walmart-yellow">Mart</span></span>
    </div>
  );
};

export default Logo;
