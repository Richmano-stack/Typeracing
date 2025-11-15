import React from 'react';
import Link from 'next/link';
import { Play, Users, Brain, TrendingUp } from 'lucide-react'; 

// Definition of the three primary actions (unchanged)
const actionCards = [
  {
    title: 'Quick Multiplayer Race',
    description: "Compete against racers from around the globe instantly.",
    href: '/race',
    icon: Play,
    isPrimary: true,
  },
  {
    title: 'Create a Private Race',
    description: "Invite your friends with a unique link for a friendly race.",
    href: '/create',
    icon: Users,
    isPrimary: false,
  },
  {
    title: 'Practice Yourself Mode',
    description: "Focus on precision and race against your previous best performances.",
    href: '/practice',
    icon: Brain,
    isPrimary: false,
  },
];

// Reusable card component (unchanged)
interface ActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  isPrimary: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, href, icon: Icon, isPrimary }) => {
    
  const primaryStyle = isPrimary 
    ? { backgroundColor: 'var(--accent)', color: 'var(--bg-base)' }
    : { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' };

  const hoverEffect = isPrimary 
    ? 'hover:scale-[1.03]'
    : 'hover:border-accent hover:shadow-lg';
    
  const accentColor = isPrimary ? 'var(--bg-base)' : 'var(--accent)';

  return (
    <Link href={href} passHref>
      <div 
        className={`ui-card flex flex-col justify-between p-6 cursor-pointer transition transform duration-300 ${hoverEffect} h-full`}
        style={primaryStyle}
      >
        <div className="flex items-center space-x-3 mb-3">
          <Icon size={32} style={{ color: accentColor }} />
          <h3 className={`text-2xl font-bold ${isPrimary ? 'text-black' : 'text-primary'}`}>
            {title}
          </h3>
        </div>
        <p className={`mt-2 ${isPrimary ? 'text-gray-800' : 'text-secondary'}`}>
          {description}
        </p>
      </div>
    </Link>
  );
};

const HeroSection: React.FC = () => {
  return (
    <section className="flex flex-col items-center justify-center pt-10 pb-20 px-4 text-center">
      
      {/* Incentive Headings */}
      <div className="max-w-5xl">
        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
          Master the Keyboard. 
          <span className="text-accent text-shadow-md inline-block" style={{ color: 'var(--accent)' }}> Beat Your Friends.</span>
        </h1>
        <h2 className="text-xl sm:text-2xl font-light" style={{ color: 'var(--text-secondary)' }}>
          The competitive online typing game.
        </h2>
      </div>

      {/* Primary Call to Action (CTA) - Isolated for high visibility */}
      <Link href={actionCards[0].href} passHref>
        <button
          className="mt-12 w-full max-w-lg font-extrabold py-6 px-10 rounded-xl shadow-2xl text-2xl transition duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-3"
          style={{ 
            backgroundColor: 'var(--accent)', 
            color: 'var(--bg-base)',
            boxShadow: '0 0 40px rgba(0, 255, 166, 0.5)', 
          }}
        >
          <Play size={28} />
          <span>{actionCards[0].title}</span>
        </button>
      </Link>
      
      {/* NEW: Create an Account CTA */}
      <div className="mt-4 flex flex-col items-center">
          <Link href="/register" passHref>
            <span 
              className="text-lg font-semibold cursor-pointer hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              🚀 Create a free account to save your stats!
            </span>
          </Link>
      </div>

      {/* Subtext under CTA (Moved down) */}
      <p className="mt-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Over <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>300 races</span> launched in the last hour.
      </p>


      {/* Grid of Secondary Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mt-12">
        {actionCards.slice(1).map((card) => ( 
          <ActionCard key={card.title} {...card} />
        ))}
      </div>

      {/* Social Proof Section (Below Cards) */}
      <div className="mt-16 flex items-center space-x-2" style={{ color: 'var(--text-secondary)' }}>
          <TrendingUp size={24} style={{ color: 'var(--accent)' }} />
          <span className="text-xl">
            <strong style={{ color: 'var(--accent)' }}>128 racers</strong> are online. | Today's Record: <strong style={{ color: 'var(--text-primary)' }}>150 WPM</strong>
          </span>
      </div>

    </section>
  );
};

export default HeroSection;