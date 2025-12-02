import { useState, useMemo } from 'react';
import { RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { Layout } from '../components/Layout';
import { SearchBar } from '../components/SearchBar';
import { ResultCounter } from '../components/ResultCounter';
import { PostCard } from '../components/PostCard';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { fetchMonkrus, refresh } from '../api/fetchMonkrus';
import { useFetchJSON } from '../hooks/useFetchJSON';
import { useDebounce } from '../hooks/useDebounce';
import type { Post } from '../types';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedQuery = useDebounce(searchQuery, 200);
  
  const { data: posts, loading, error, refetch } = useFetchJSON(fetchMonkrus);

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!posts || !debouncedQuery.trim()) return posts || [];
    
    const query = debouncedQuery.toLowerCase().trim();
    return posts.filter(post => 
      post.title.toLowerCase().includes(query)
    );
  }, [posts, debouncedQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPosts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  // Reset to page 1 when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [debouncedQuery]);

  const handleRefresh = async () => {
    try {
      await refresh();
      refetch();
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Failed to load data
            </h1>
            <p className="text-muted-foreground mb-6">
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Try Again
              </button>
              <div className="text-sm text-muted-foreground">
                <a
                  href="https://github.com/dvuzu/monkrus-search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-link hover:text-link/80"
                >
                  <ExternalLink className="w-3 h-3" />
                  View data source
                </a>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-5">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            disabled={loading}
          />

          <div className="flex items-center justify-between text-xs">
            <ResultCounter
              count={filteredPosts.length}
              total={posts?.length || 0}
              loading={loading}
            />
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Refresh data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {loading && !posts ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card/30 border border-border/30 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-muted/50 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 && debouncedQuery ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-sm">No results for "{debouncedQuery}"</p>
            </div>
          ) : filteredPosts.length === 0 && posts?.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-sm">No data available</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {paginatedPosts.map((post, index) => (
                  <PostCard key={`${post.link}-${index}`} post={post} />
                ))}
              </div>
              
              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
