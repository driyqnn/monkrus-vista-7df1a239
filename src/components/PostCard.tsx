import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Zap } from 'lucide-react';
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
    <article className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:bg-card hover:border-border hover:shadow-sm transition-all duration-200 group">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex-1 min-w-0 text-sm text-card-foreground/90 group-hover:text-card-foreground leading-snug truncate">
          {post.title}
        </h3>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {bestMirror && (
            <button
              onClick={handleBestMirror}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-2 border-dashed border-emerald-500/50 rounded-lg hover:bg-emerald-500/20 hover:border-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm font-medium"
              aria-label="Open best mirror"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Access</span>
            </button>
          )}
          
          {post.links.length > 1 && (
            <button
              onClick={handleToggle}
              onKeyDown={handleKeyDown}
              aria-expanded={isExpanded}
              aria-controls={listId}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} all mirrors`}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-150"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="text-xs tabular-nums">
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
          originalLink={post.link}
        />
      )}
    </article>
  );
});