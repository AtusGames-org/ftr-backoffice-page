import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import yaml from 'js-yaml';
import PostCard from '../components/PostCard';
import { FaClock } from 'react-icons/fa';

function Home() {
    const [posts, setPosts] = useState<any[]>([]);
    const [videos, setVideos] = useState<string[]>([]);
    const [images, setImages] = useState<string[]>([]);
    const [backgroundUpper, setBackgroundUpper] = useState<string>('');
    const [backgroundLower, setBackgroundLower] = useState<string>('');
    const [showPopup, setShowPopup] = useState<boolean>(false);
    const [description, setDescription] = useState<string>('');
    const [discordLink, setDiscordLink] = useState<string>('');

    useEffect(() => {
        const loadPosts = async () => {
            const postModules = import.meta.glob('/data/blog-page/**/metadata.yaml', { query: '?raw', import: 'default' });
            const postList = [];

            for (const path in postModules) {
                const metadataContent = await postModules[path]();
                const metadata = yaml.load(metadataContent as string) as { post: { title: string; date: string; author: string } };

                // Get the post folder path
                const postFolder = path.replace('/metadata.yaml', '');

                // Load thumbnail
                const thumbnailModules = import.meta.glob('/data/blog-page/**/imgs/thumbnail.jpg', { query: '?url', import: 'default' });
                const thumbnailPath = `${postFolder}/imgs/thumbnail.jpg`;
                let thumbnail = '';

                for (const thumbPath in thumbnailModules) {
                    if (thumbPath === thumbnailPath) {
                        thumbnail = (await thumbnailModules[thumbPath]()) as string;
                        break;
                    }
                }

                postList.push({
                    ...metadata.post,
                    folder: postFolder,
                    thumbnail
                });
            }

            // Sort by date descending and take latest 3
            postList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setPosts(postList.slice(0, 3));
        };

        // Load videos
        const loadVideos = async () => {
            const videoModule = await import('/data/media-page/videos.yaml?raw');
            const data = yaml.load(videoModule.default) as { links: string[] };
            setVideos(data.links.slice(0, 3)); // Latest 3
        };

        // Load images
        const loadImages = async () => {
            const imageModules = import.meta.glob('/data/media-page/imgs/*', { query: '?url', import: 'default' });
            const imageList: string[] = [];
            for (const path in imageModules) {
                const url = await imageModules[path]() as string;
                imageList.push(url);
            }
            setImages(imageList.slice(0, 3)); // Latest 3
        };

        // Load background image
        // const loadBackground = async () => {
        //   try {
        //     const bgModule = await import('/data/home-page/background.jpg?url');
        //     setBackground(bgModule.default);
        //   } catch (e) {
        //     // Background not found, use default
        //   }
        // };

        // Load background images
        const loadBackgrounds = async () => {
            const upperModule = await import('/data/home-page/background-upper.jpg?url');
            const lowerModule = await import('/data/home-page/background-lower.jpg?url');
            setBackgroundUpper(upperModule.default);
            setBackgroundLower(lowerModule.default);
        };

        // Load metadata
        const loadMetadata = async () => {
            const metadataModule = await import('/data/metadata.yaml?raw');
            const metadata = yaml.load(metadataModule.default) as { description: string; socials: { discord: string } };
            setDescription(metadata.description);
            setDiscordLink(metadata.socials.discord);
        };

        loadPosts();
        loadVideos();
        loadImages();
        loadBackgrounds();
        loadMetadata();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Hero */}
            <section className="relative min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${backgroundUpper})` }}>
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
                <div className="relative text-center z-10 px-4">
                    <div className="flex justify-center items-center mb-4">
                        <img src="/logo.jpg" alt="Feed the Realm Logo" className="h-16 w-16 md:h-20 md:w-20 mr-4" />
                        <h2 className="text-4xl md:text-6xl font-bold text-white">Feed the Realm</h2>
                    </div>
                    <p className="text-lg md:text-xl mb-8 text-gray-300 max-w-2xl mx-auto">The ultimate MMO experience with world creation tools</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={() => setShowPopup(true)} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-lg font-semibold transition">Download Player</button>
                        <button onClick={() => setShowPopup(true)} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-lg font-semibold transition">Download Creator</button>
                    </div>
                </div>
            </section>

            {/* Game Description */}
            <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
                            Discover the Future of Gaming
                        </h3>
                        <p className="text-lg md:text-xl mb-10 text-gray-200 leading-relaxed">
                            {description}
                        </p>
                        <a
                            href={discordLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center px-8 py-4
                                bg-gradient-to-r from-blue-600 to-purple-600
                                hover:from-blue-700 hover:to-purple-700
                                text-white font-extrabold text-lg
                                rounded-full
                                transition-all duration-300
                                transform hover:scale-105
                                shadow-lg hover:shadow-2xl
                                [text-shadow:0_2px_4px_rgba(0,0,0,0.6)]"
                        >
                            <span className='text-white opacity-50 group-hover:opacity-100 transition-opacity'>Join Our Community</span>
                            <svg className="ml-2 w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </a>

                    </div>
                </div>
            </section>

            {/* Latest Posts */}
            <section className="py-20 bg-cover bg-center relative" style={{ backgroundImage: `url(${backgroundLower})` }}>
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <h3 className="text-2xl md:text-4xl font-bold text-center mb-12 text-white">Latest Posts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {posts.map((post, index) => (
                            <PostCard key={index} post={post} />
                        ))}
                    </div>
                    <div className="text-center mt-8">
                        <Link to="/blog" className="border border-white text-white hover:bg-white hover:text-black px-6 py-3 rounded transition">Show More</Link>
                    </div>
                </div>
            </section>

            {/* Latest Media */}
            <section className="py-20 bg-gray-900">
                <div className="container mx-auto px-4">
                    <h3 className="text-2xl md:text-4xl font-bold text-center mb-12">Latest Media</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {images.map((image, index) => (
                            <img key={index} src={image} alt={`Media ${index}`} className="w-full h-auto" />
                        ))}
                        {videos.map((video, index) => (
                            <div key={index} className="aspect-video">
                                <iframe src={`https://www.youtube.com/embed/${video.split('v=')[1]}`} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-8">
                        <Link to="/media" className="border border-white text-white hover:bg-white hover:text-black px-6 py-3 rounded transition">Show More</Link>
                    </div>
                </div>
            </section>
            {showPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white text-black p-6 rounded-lg max-w-md mx-4">
                        <FaClock className="text-4xl text-blue-600 mb-4 mx-auto" />
                        <h2 className="text-xl font-bold mb-2 text-center">Coming Soon!</h2>
                        <p className="text-center">Early access downloads are not yet available but will be in the future.</p>
                        <div className="text-center mt-4">
                            <button onClick={() => setShowPopup(false)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;
