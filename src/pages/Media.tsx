import { useState, useEffect } from 'react';
import yaml from 'js-yaml';

function Media() {
    const [videos, setVideos] = useState<string[]>([]);
    const [images, setImages] = useState<string[]>([]);
    const [background, setBackground] = useState<string>('');

    useEffect(() => {
        const loadVideos = async () => {
            const videoModule = await import('/data/media-page/videos.yaml?raw');
            const data = yaml.load(videoModule.default) as { links: string[] };
            setVideos(data.links);
        };

        const loadImages = async () => {
            const imageModules = import.meta.glob('/data/media-page/imgs/*', { query: '?url', import: 'default' });
            const imageList: string[] = [];
            for (const path in imageModules) {
                const url = await imageModules[path]() as string;
                imageList.push(url);
            }
            setImages(imageList);
        };

        const loadBackground = async () => {
            const bgModule = await import('/data/media-page/background.jpg?url');
            setBackground(bgModule.default);
        };

        loadVideos();
        loadImages();
        loadBackground();
    }, []);

    return (
        <div className="min-h-screen bg-cover bg-center relative" style={{ backgroundImage: `url(${background})` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
            <div className="container mx-auto px-4 py-20 relative z-10 text-white">
                <h1 className="text-3xl md:text-5xl font-bold text-center mb-12">Media</h1>

                {/* Pictures Section */}
                {images.length > 0 && (
                    <div>
                        <h2 className="text-2xl md:text-4xl font-bold text-center mb-8">Pictures</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {images.map((image, index) => (
                                <img key={index} src={image} alt={`Media ${index}`} className="w-full h-auto rounded" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Videos Section */}
                {videos.length > 0 && (
                    <div className="mb-16">
                        <h2 className="text-2xl md:text-4xl font-bold text-center mb-8">Videos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {videos.map((video, index) => (
                                <div key={index} className="aspect-video bg-black/50 p-2 rounded">
                                    <iframe src={`https://www.youtube.com/embed/${video.split('v=')[1]}`} className="w-full h-full rounded" frameBorder="0" allowFullScreen></iframe>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Media;
