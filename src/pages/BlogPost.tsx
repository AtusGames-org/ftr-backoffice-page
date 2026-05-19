import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import yaml from 'js-yaml';

function BlogPost() {
  const { date } = useParams<{ date: string }>();
  const [post, setPost] = useState<{
    title: string;
    date: string;
    author: string;
    content: string;
  } | null>(null);
  const [background, setBackground] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      if (!date) {
        setError('No date provided');
        setLoading(false);
        return;
      }

      try {
        // Load metadata
        const metadataModule = await import(`/data/blog-page/${date}/metadata.yaml?raw`);
        const metadata = yaml.load(metadataModule.default as string) as {
          post: { title: string; date: string; author: string }
        };

        // Load post content
        const contentModule = await import(`/data/blog-page/${date}/post.md?raw`);
        const content = contentModule.default as string;

        // Load background (optional)
        let backgroundUrl = '';
        try {
          const bgModule = await import(`/data/blog-page/${date}/background.jpg?url`);
          backgroundUrl = bgModule.default as string;
        } catch {
          // Use blog page background as fallback
          try {
            const blogBgModule = await import('/data/blog-page/background.jpg?url');
            backgroundUrl = blogBgModule.default as string;
          } catch {
            // No background available
          }
        }

        setPost({
          ...metadata.post,
          content
        });
        setBackground(backgroundUrl);
        setLoading(false);
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Post not found');
        setLoading(false);
      }
    };

    loadPost();
  }, [date]);

  // Format date manually to avoid timezone issues
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${parseInt(month)}/${parseInt(day)}/${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-red-400">{error || 'Post not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center relative" style={{ backgroundImage: `url(${background})` }}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
      <div className="container mx-auto px-4 py-20 relative z-10 text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center mb-8 text-gray-300">
            <span className="mr-4">By {post.author}</span>
            <span>{formatDate(post.date)}</span>
          </div>
          <div className="bg-black/70 backdrop-blur-sm p-8 rounded-lg">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">{children}</h2>,
                h2: ({ children }) => <h3 className="text-xl md:text-2xl font-bold mb-3 text-white mt-8">{children}</h3>,
                h3: ({ children }) => <h4 className="text-lg md:text-xl font-semibold mb-2 text-white mt-6">{children}</h4>,
                p: ({ children }) => <p className="text-gray-200 mb-4 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-200">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-200">{children}</ol>,
                li: ({ children }) => <li className="text-gray-200">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300 my-4">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-800 px-2 py-1 rounded text-sm font-mono text-green-400">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-800 p-4 rounded overflow-x-auto my-4">
                    {children}
                  </pre>
                ),
                img: ({ src, alt, ...props }) => {
                  // Transform relative image paths to absolute paths
                  let imageSrc = src;
                  if (src && src.startsWith('./imgs/')) {
                    imageSrc = `/data/blog-page/${date}/imgs/${src.substring(7)}`;
                  }
                  return <img src={imageSrc} alt={alt} {...props} className="rounded-lg max-w-full h-auto my-4" />;
                },
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlogPost;