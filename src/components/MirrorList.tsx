import { ExternalLink } from 'lucide-react';
import { isRecommendedMirror, getDomainFromUrl } from '../utils/highlightRecommended';

interface MirrorListProps {
  mirrors: string[];
  isExpanded: boolean;
  listId: string;
}

export function MirrorList({ mirrors, isExpanded, listId }: MirrorListProps) {
  if (!isExpanded) return null;

  return (
    <div
      id={listId}
      className="mt-4 space-y-2 animate-in slide-in-from-top-2 duration-200"
    >
      <h4 className="text-sm font-medium text-muted-foreground mb-3">
        Download Mirrors ({mirrors.length})
      </h4>
      <ul className="space-y-2" role="list">
        {mirrors.map((mirror, index) => {
          const isRecommended = isRecommendedMirror(mirror);
          const domain = getDomainFromUrl(mirror);
          
          return (
            <li key={index} className="group">
              <a
                href={mirror}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
                  hover:shadow-md hover:scale-[1.02] focus:scale-[1.02]
                  ${isRecommended 
                    ? 'bg-positive/5 border-positive/20 text-link-recommended hover:bg-positive/10' 
                    : 'bg-card border-border text-link hover:bg-accent/50'
                  }
                `}
                aria-label={`Download from ${domain}${isRecommended ? ' (recommended)' : ''}`}
              >
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate font-medium">
                  {domain}
                </span>
                {isRecommended && (
                  <span className="text-xs px-2 py-1 bg-positive/20 text-positive rounded-md font-medium">
                    recommended
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