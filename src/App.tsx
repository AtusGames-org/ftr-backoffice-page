import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Features from './pages/Features';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Media from './pages/Media';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:date" element={<BlogPost />} />
          <Route path="/media" element={<Media />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
