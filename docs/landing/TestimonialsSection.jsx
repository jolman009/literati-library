import React, { useState, useEffect } from 'react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Sarah Martinez',
      role: 'Level 9 Reader, Spain',
      initials: 'SM',
      text: 'ShelfQuest turned me from someone who read 2 books a year to 50+ books! The gamification is genius - I actually look forward to reading time now.',
    },
    {
      name: 'David Kim',
      role: 'Literature Student, California',
      initials: 'DK',
      text: 'The achievement system is incredibly motivating. I\'ve unlocked achievements I never thought possible, and my comprehension has improved dramatically.',
    },
    {
      name: 'Emma Johnson',
      role: 'Book Reviewer, UK',
      initials: 'EJ',
      text: 'Finally, a reading app that understands motivation! The level progression and smart goals keep me engaged, and the offline reading is perfect for my commute.',
    }
  ];

  return (
    <section className="testimonials-section">
      <div className="section-container">
        <h2 className="section-title">Loved by Readers Worldwide</h2>
        <p className="section-subtitle">
          Join thousands of readers who've transformed their reading habits with ShelfQuest
        </p>
        
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <p className="testimonial-text">"{testimonial.text}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">{testimonial.initials}</div>
                <div className="author-info">
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-title">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;