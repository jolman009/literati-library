import React from 'react';
import { 
  HeroSection, 
  InteractiveFeatureCards, 
  ReadingTimeCalculator, 
  InteractiveAchievements, 
  TestimonialsSection 
} from '../components/landing';

// In your LandingPage.jsx component
import '../styles/landing-page-complete.css';



const LandingPage = () => {
  return (
    <div className="landing-page">
      <HeroSection />
      <InteractiveFeatureCards />
      <ReadingTimeCalculator />
      <InteractiveAchievements />
      <TestimonialsSection />
    </div>
  );
};

export default LandingPage;