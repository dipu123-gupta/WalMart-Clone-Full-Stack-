import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { ShieldAlert } from 'lucide-react';

const MainLayout = () => {
  const { config } = useSelector(state => state.settings);
  const { user } = useSelector(state => state.auth);
  
  const isMaintenance = config.maintenance_mode === 'true';
  const isAdmin = user?.role === 'admin';

  if (isMaintenance && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
         <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-amber-100/50">
            <ShieldAlert size={40} />
         </div>
         <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Back in a Moment</h1>
         <p className="text-slate-500 font-medium max-w-md mx-auto mb-8 leading-relaxed">
           Our digital shelves are being restocked. We'll be back shortly with a better experience for you.
         </p>
         <div className="w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="w-2/3 h-full bg-amber-500 rounded-full animate-marquee"></div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
