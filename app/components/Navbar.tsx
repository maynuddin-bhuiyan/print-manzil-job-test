'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-xl font-bold">Mayn Task</div>
        <div className="flex space-x-6">
          <Link 
            href="/" 
            className={`hover:text-gray-300 transition-colors ${
              pathname === '/' ? 'text-blue-400' : ''
            }`}
          >
            Users Table
          </Link>
          <Link 
            href="/tshirt-design" 
            className={`hover:text-gray-300 transition-colors ${
              pathname === '/tshirt-design' ? 'text-blue-400' : ''
            }`}
          >
            T-Shirt Design
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 