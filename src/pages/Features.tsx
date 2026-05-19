import { useState, useEffect } from 'react';

function Features() {
  const [background, setBackground] = useState<string>('');

  useEffect(() => {
    const loadBackground = async () => {
      const bgModule = await import('/data/features-page/background.jpg?url');
      setBackground(bgModule.default);
    };
    loadBackground();
  }, []);

  return (
    <div className="min-h-screen bg-cover bg-center relative" style={{ backgroundImage: `url(${background})` }}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
      <div className="container mx-auto px-4 py-20 relative z-10 text-white">
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-12">Features</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <h2 className="text-xl md:text-3xl font-bold mb-4">MMO Game Player</h2>
            <p className="text-sm md:text-lg">Play in multiple worlds, interact with players worldwide, and embark on epic adventures.</p>
          </div>
          <div className="text-center">
            <h2 className="text-xl md:text-3xl font-bold mb-4">World Creator</h2>
            <p className="text-sm md:text-lg">Design your own worlds with powerful tools, publish them, and share your creations with the community.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Features;