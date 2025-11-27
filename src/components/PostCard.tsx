import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import type { Post } from '../types';
import { MirrorList } from './MirrorList';

interface PostCardProps {
  post: Post;
}

export const PostCard = React.memo(function PostCard({ post }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const listId = `mirrors-${post.link.replace(/[^a-zA-Z0-9]/g, '')}`;

  const handleToggle = () => {
    setIsExpanded(prev => !prev);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <article className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-accent/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-card-foreground leading-snug mb-3">
            {post.title}
          </h3>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 bg-positive/10 text-positive border border-positive/20 rounded-lg hover:bg-positive/20 transition-all duration-200 hover:scale-105 focus:scale-105"
            aria-label="View original Monkrus post"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm font-medium">Original</span>
          </a>
          
          {post.links.length > 0 && (
            <button
              onClick={handleToggle}
              onKeyDown={handleKeyDown}
              aria-expanded={isExpanded}
              aria-controls={listId}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} download mirrors`}
              className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-accent transition-all duration-200 hover:scale-105 focus:scale-105"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {post.links.length} mirror{post.links.length !== 1 ? 's' : ''}
              </span>
            </button>
          )}
        </div>
      </div>

      <MirrorList 
        mirrors={post.links}
        isExpanded={isExpanded}
        listId={listId}
      />
    </article>
  );
});