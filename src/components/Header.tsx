import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="sticky top-0 bg-black bg-opacity-80 p-4 z-20">
      <nav className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <img src="/logo.jpg" alt="Feed the Realm Logo" className="h-10 w-10" />
          <Link to="/" className="text-xl md:text-2xl font-bold">Feed the Realm</Link>
        </div>
        <ul className="flex space-x-2 md:space-x-4">
          <li><Link to="/" className="hover:text-blue-400 transition text-sm md:text-base">Home</Link></li>
          <li><Link to="/about" className="hover:text-blue-400 transition text-sm md:text-base">About</Link></li>
          <li><Link to="/features" className="hover:text-blue-400 transition text-sm md:text-base">Features</Link></li>
          <li><Link to="/blog" className="hover:text-blue-400 transition text-sm md:text-base">Blog</Link></li>
          <li><Link to="/media" className="hover:text-blue-400 transition text-sm md:text-base">Media</Link></li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;