import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Award } from 'lucide-react';
import type { Post } from '../types';
import { MirrorList } from './MirrorList';
import { isRecommendedMirror } from '../utils/highlightRecommended';

interface PostCardProps {
  post: Post;
}

export const PostCard = React.memo(function PostCard({ post }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const listId = `mirrors-${post.link.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  const bestMirror = post.links.find(isRecommendedMirror) || post.links[0];

  const handleToggle = () => {
    setIsExpanded(prev => !prev);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  const handleBestMirror = () => {
    if (bestMirror) {
      window.open(bestMirror, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-all duration-200 hover:border-primary/30 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-card-foreground leading-snug group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {bestMirror && (
            <button
              onClick={handleBestMirror}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 focus:scale-105 shadow-sm font-medium"
              aria-label="Open best mirror"
            >
              <Award className="w-4 h-4" />
              <span>Best Mirror</span>
            </button>
          )}
          
          {post.links.length > 1 && (
            <button
              onClick={handleToggle}
              onKeyDown={handleKeyDown}
              aria-expanded={isExpanded}
              aria-controls={listId}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} all mirrors`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-accent transition-all duration-200 hover:scale-105 focus:scale-105"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="text-sm">
                {post.links.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {post.links.length > 1 && (
        <MirrorList 
          mirrors={post.links}
          isExpanded={isExpanded}
          listId={listId}
        />
      )}
    </article>
  );
});