import { Link } from 'react-router-dom';

interface PostCardProps {
  post: {
    title: string;
    date: string;
    author: string;
    folder: string;
    thumbnail: string;
  };
  className?: string;
}

function PostCard({ post, className = '' }: PostCardProps) {
  // Format date manually to avoid timezone issues
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${parseInt(month)}/${parseInt(day)}/${year}`;
  };

  return (
    <Link
      to={`/blog/${post.folder.split('/').pop()}`}
      className={`bg-black/70 backdrop-blur-sm p-6 rounded cursor-pointer hover:bg-black/80 transition-all duration-300 block ${className}`}
    >
      {post.thumbnail && (
        <img
          src={post.thumbnail}
          alt={post.title}
          className="w-full h-48 object-cover rounded mb-4"
        />
      )}
      <h4 className="text-lg md:text-xl font-bold mb-2">{post.title}</h4>
      <p className="text-sm text-gray-300 mb-1">By {post.author}</p>
      <p className="text-sm text-gray-400">{formatDate(post.date)}</p>
    </Link>
  );
}

export default PostCard;