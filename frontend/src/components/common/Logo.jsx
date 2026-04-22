import { useSelector } from 'react-redux';

const Logo = ({ className = "h-8" }) => {
  const { config } = useSelector(state => state.settings);
  const siteName = config.site_name || 'WalMart';
  
  // Split sitename for styling if it contains "Mart" or similar
  const firstPart = siteName.replace(/Mart/i, '');
  const hasMart = /Mart/i.test(siteName);

  return (
    <div className={`flex items-center gap-1.5 font-bold text-walmart-blue shadow-sm hover:shadow-md px-3 py-1 rounded-full transition-all bg-white/50 backdrop-blur-sm ${className}`}>
      <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
        <div className="absolute inset-0 bg-walmart-yellow rounded-full animate-pulse-slow"></div>
        <span className="relative text-lg sm:text-xl">🛒</span>
      </div>
      <span className="text-lg sm:text-xl tracking-tight whitespace-nowrap">
        {firstPart}
        {hasMart && <span className="text-walmart-yellow">Mart</span>}
      </span>
    </div>
  );
};

export default Logo;
