import { useState, useEffect } from 'react';
import { FaYoutube, FaDiscord, FaTwitter, FaGlobe } from 'react-icons/fa';
import yaml from 'js-yaml';

function Footer() {
  const [socials, setSocials] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadMetadata = async () => {
      const metadataModule = await import('/data/metadata.yaml?raw');
      const metadata = yaml.load(metadataModule.default) as { socials: { [key: string]: string } };
      setSocials(metadata.socials);
    };
    loadMetadata();
  }, []);

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <FaYoutube className="w-5 h-5" />;
      case 'discord':
        return <FaDiscord className="w-5 h-5" />;
      case 'twitter':
        return <FaTwitter className="w-5 h-5" />;
      case 'bluesky':
        return <FaGlobe className="w-5 h-5" />;
      default:
        return <FaGlobe className="w-5 h-5" />;
    }
  };

  return (
    <footer className="bg-gradient-to-t from-black via-gray-900 to-black text-white">
      {/* Social Media Section */}
      <div className="border-t border-gray-800 pt-12 pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Join Our Community
            </h3>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Follow us for the latest updates, behind-the-scenes content, and exclusive announcements about Feed the Realm
            </p>
          </div>

          <div className="flex justify-center space-x-8 mb-8">
            {Object.entries(socials).map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-800/50 transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-gray-400 group-hover:text-white transition-colors duration-300">
                  {getSocialIcon(platform)}
                </div>
                <span className="text-sm font-medium capitalize text-gray-300 group-hover:text-white transition-colors duration-300">
                  {platform}
                </span>
              </a>
            ))}
          </div>

          <div className="text-center border-t border-gray-800 pt-8">
            <p className="text-gray-400 text-sm mb-2">
              &copy; 2026 Feed the Realm. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs">
              Crafting worlds, building communities, revolutionizing gaming.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;