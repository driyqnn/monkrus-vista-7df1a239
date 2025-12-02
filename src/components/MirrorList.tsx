import { ExternalLink, Link2 } from 'lucide-react';
import { isRecommendedMirror, getDomainFromUrl } from '../utils/highlightRecommended';

interface MirrorListProps {
  mirrors: string[];
  isExpanded: boolean;
  listId: string;
  originalLink: string;
}

export function MirrorList({ mirrors, isExpanded, listId, originalLink }: MirrorListProps) {
  if (!isExpanded) return null;

  return (
    <div
      id={listId}
      className="mt-4 pt-4 border-t border-border/50 animate-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {mirrors.length} mirrors available
        </span>
        <a
          href={originalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-md transition-all"
        >
          <Link2 className="w-3 h-3" />
          Original Post
        </a>
      </div>
      <ul className="space-y-1.5" role="list">
        {mirrors.map((mirror, index) => {
          const isRecommended = isRecommendedMirror(mirror);
          const domain = getDomainFromUrl(mirror);
          
          return (
            <li key={index}>
              <a
                href={mirror}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150
                  ${isRecommended 
                    ? 'bg-positive/10 text-positive hover:bg-positive/15' 
                    : 'text-link hover:bg-accent/50'
                  }
                `}
              >
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                <span className="flex-1 truncate text-sm">
                  {domain}
                </span>
                {isRecommended && (
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-positive/20 rounded font-semibold">
                    best
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}