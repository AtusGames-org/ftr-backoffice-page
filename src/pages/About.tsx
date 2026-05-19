import { useState, useEffect } from 'react';
import yaml from 'js-yaml';

function About() {
  const [background, setBackground] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    const loadBackground = async () => {
      const bgModule = await import('/data/about-page/background.jpg?url');
      setBackground(bgModule.default);
    };

    const loadTeam = async () => {
      const teamYamlModule = await import('/data/about-page/team/team.yaml?raw');
      const teamData = yaml.load(teamYamlModule.default) as { members: Record<string, { name: string; position: string }> };

      const imageModules = import.meta.glob('/data/about-page/team/imgs/*.jpg', { query: '?url', import: 'default' });
      const members = [];

      for (const id in teamData.members) {
        const member = teamData.members[id];
        const imagePath = `/data/about-page/team/imgs/${id}.jpg`;
        let imageUrl = '';

        for (const path in imageModules) {
          if (path === imagePath) {
            imageUrl = await imageModules[path]() as string;
            break;
          }
        }

        members.push({
          ...member,
          image: imageUrl
        });
      }

      setTeamMembers(members);
    };

    const loadDescription = async () => {
      const metadataModule = await import('/data/metadata.yaml?raw');
      const metadata = yaml.load(metadataModule.default) as { description: string };
      setDescription(metadata.description);
    };

    loadBackground();
    loadTeam();
    loadDescription();
  }, []);

  return (
    <div className="min-h-screen bg-cover bg-center relative" style={{ backgroundImage: `url(${background})` }}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
      <div className="container mx-auto px-4 py-20 relative z-10 text-white">
        <h1 className="text-3xl md:text-5xl font-bold mb-8 text-center">About Feed the Realm</h1>
        <p className="text-base md:text-lg max-w-3xl mx-auto text-center">
          {description}
        </p>

        {/* Team Section */}
        <div className="mt-16">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-8">Meet the Team</h2>
          <p className="text-base md:text-lg max-w-4xl mx-auto text-center mb-12 text-gray-200">
            Feed the Realm was born from our team's final university project, and we're passionately developing it with cutting-edge technology, innovative gameplay mechanics, and a vision to revolutionize the MMO landscape. Our dedicated developers bring fresh perspectives and boundless creativity to create an unparalleled gaming experience.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white"
                />
                <h3 className="text-lg font-semibold">{member.name}</h3>
                <p className="text-gray-300">{member.position}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;