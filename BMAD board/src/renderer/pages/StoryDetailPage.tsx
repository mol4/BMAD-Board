import { useParams } from 'react-router-dom';

export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Story Detail</h1>
      <p className="text-gray-400">Story ID: {id}</p>
    </div>
  );
}
