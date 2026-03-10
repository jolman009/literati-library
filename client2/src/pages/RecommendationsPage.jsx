// RecommendationsPage — AI-powered book recommendations based on user's library.

import React, { useState, useEffect, useCallback } from 'react';
import { useBookLibrary } from '../hooks/useBookLibrary';
import ReadingAssistant from '../services/ReadingAssistant';
import { Sparkles, BookOpen, RefreshCw, ExternalLink, Star, Compass, Library, ShoppingBag, ShoppingCart } from 'lucide-react';
import { bookshopUrl, amazonUrl } from '../utils/affiliateLinks';
import './RecommendationsPage.css';

const MATCH_LABELS = {
  similar_genre: 'Similar Genre',
  same_author: 'Same Author',
  thematic_match: 'Thematic Match',
  stretch_pick: 'Stretch Pick',
};

const MATCH_ICONS = {
  similar_genre: Library,
  same_author: Star,
  thematic_match: BookOpen,
  stretch_pick: Compass,
};

function RecommendationCard({ rec }) {
  const MatchIcon = MATCH_ICONS[rec.matchType] || BookOpen;
  const matchLabel = MATCH_LABELS[rec.matchType] || rec.matchType;

  return (
    <div className="rec-card">
      <div className="rec-card__header">
        <div className="rec-card__match-badge">
          <MatchIcon size={14} />
          <span>{matchLabel}</span>
        </div>
      </div>
      <h3 className="rec-card__title">{rec.title}</h3>
      <p className="rec-card__author">by {rec.author}</p>
      <span className="rec-card__genre">{rec.genre}</span>
      <p className="rec-card__reason">{rec.reason}</p>
      <div className="rec-card__actions">
        <a
          href={bookshopUrl(rec.title, rec.author)}
          target="_blank"
          rel="noopener noreferrer"
          className="rec-card__link rec-card__link--bookshop"
        >
          <ShoppingBag size={14} />
          Bookshop.org
        </a>
        <a
          href={amazonUrl(rec.title, rec.author)}
          target="_blank"
          rel="noopener noreferrer"
          className="rec-card__link rec-card__link--amazon"
        >
          <ShoppingCart size={14} />
          Amazon
        </a>
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const { books, loading: booksLoading } = useBookLibrary();
  const [recommendations, setRecommendations] = useState([]);
  const [topGenres, setTopGenres] = useState([]);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    if (!books || books.length === 0) return;
    setLoading(true);
    try {
      const result = await ReadingAssistant.getBookRecommendations(books, 6);
      if (result) {
        setRecommendations(result.recommendations);
        setTopGenres(result.topGenres || []);
        setAiGenerated(result.aiGenerated);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [books]);

  useEffect(() => {
    if (!booksLoading && books.length > 0 && !hasLoaded) {
      fetchRecommendations();
    }
  }, [booksLoading, books, hasLoaded, fetchRecommendations]);

  if (booksLoading) {
    return (
      <div className="recommendations-page">
        <div className="rec-loading">
          <Sparkles size={32} className="rec-loading__icon" />
          <p>Loading your library...</p>
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="recommendations-page">
        <div className="rec-header">
          <div className="rec-header__title-row">
            <Sparkles size={24} />
            <h1>Book Recommendations</h1>
          </div>
          <p className="rec-header__subtitle">AI-powered picks based on your reading tastes</p>
        </div>
        <div className="rec-empty">
          <BookOpen size={48} />
          <h2>Add books to your library first</h2>
          <p>We need to know what you read to suggest what you'll love. Upload or add a few books to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-page">
      <div className="rec-header">
        <div className="rec-header__title-row">
          <Sparkles size={24} />
          <h1>Book Recommendations</h1>
          {aiGenerated && <span className="rec-header__ai-badge">AI-Powered</span>}
        </div>
        <p className="rec-header__subtitle">
          Based on {books.length} books in your library
          {topGenres.length > 0 && ` — you love ${topGenres.slice(0, 3).join(', ')}`}
        </p>
        <button
          className="rec-header__refresh"
          onClick={fetchRecommendations}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'rec-spin' : ''} />
          {loading ? 'Finding books...' : 'Get new picks'}
        </button>
      </div>

      {loading && !hasLoaded ? (
        <div className="rec-loading">
          <Sparkles size={32} className="rec-loading__icon rec-spin" />
          <p>Analyzing your reading tastes...</p>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="rec-grid">
          {recommendations.map((rec, i) => (
            <RecommendationCard key={`${rec.title}-${i}`} rec={rec} />
          ))}
        </div>
      ) : hasLoaded ? (
        <div className="rec-empty">
          <BookOpen size={48} />
          <h2>No recommendations yet</h2>
          <p>Try refreshing to get personalized picks.</p>
        </div>
      ) : null}

      {recommendations.length > 0 && (
        <p className="rec-affiliate-disclosure">
          Book links may earn ShelfQuest a small commission at no extra cost to you. Bookshop.org purchases support independent bookstores.
        </p>
      )}
    </div>
  );
}
