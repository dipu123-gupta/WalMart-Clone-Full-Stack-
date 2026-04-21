import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';
import { SUPPORT_EMAIL, SUPPORT_PHONE, SITE_ADDRESS, SITE_NAME } from '@/constants';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center sm:text-left">
          {/* Brand */}
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-walmart-blue flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="text-xl font-bold text-white">{SITE_NAME.split(' ')[0]}</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Your one-stop shop for everything you need. Quality products at unbeatable prices.
            </p>
            <div className="flex justify-center sm:justify-start gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-walmart-blue transition-colors">
                <FaFacebook size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-walmart-blue transition-colors">
                <FaTwitter size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-walmart-blue transition-colors">
                <FaInstagram size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-walmart-blue transition-colors">
                <FaYoutube size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-walmart-yellow transition-colors">All Products</Link></li>
              <li><Link to="/flash-sales" className="hover:text-walmart-yellow transition-colors">Flash Sales</Link></li>
              <li><Link to="/orders" className="hover:text-walmart-yellow transition-colors">Track Order</Link></li>
              <li><Link to="/wishlist" className="hover:text-walmart-yellow transition-colors">Wishlist</Link></li>
              <li><Link to="/seller/register" className="hover:text-walmart-yellow transition-colors">Sell with Us</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-walmart-yellow transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-walmart-yellow transition-colors">Returns & Refunds</a></li>
              <li><a href="#" className="hover:text-walmart-yellow transition-colors">Shipping Info</a></li>
              <li><a href="#" className="hover:text-walmart-yellow transition-colors">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-walmart-yellow transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><Mail size={16} className="text-walmart-blue" /> {SUPPORT_EMAIL}</li>
              <li className="flex items-center gap-2"><Phone size={16} className="text-walmart-blue" /> {SUPPORT_PHONE}</li>
              <li className="flex items-start gap-2"><MapPin size={16} className="text-walmart-blue mt-1" /> {SITE_ADDRESS}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} WalMart Clone. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/100px-MasterCard_Logo.svg.png" alt="Mastercard" className="h-6 opacity-60" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/100px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6 opacity-60" />
            <span className="text-xs text-gray-500">Secured by Razorpay</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
