import { useState, useMemo } from 'react';
import { RefreshCw, AlertCircle, Database, ExternalLink } from 'lucide-react';
import { Layout } from '../components/Layout';
import { SearchBar } from '../components/SearchBar';
import { ResultCounter } from '../components/ResultCounter';
import { PostCard } from '../components/PostCard';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { fetchMonkrus, refresh } from '../api/fetchMonkrus';
import { useFetchJSON } from '../hooks/useFetchJSON';
import { useDebounce } from '../hooks/useDebounce';
import type { Post } from '../types';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
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
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Monkrus Mirror Viewer
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fast, accessible mirror viewer for Monkrus downloads with real-time search
          </p>
        </header>

        <div className="space-y-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            disabled={loading}
          />

          <div className="flex items-center justify-between">
            <ResultCounter
              count={filteredPosts.length}
              total={posts?.length || 0}
              loading={loading}
            />
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              aria-label="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading && !posts ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded mb-3 w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 && debouncedQuery ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">No results found</div>
              <div className="text-sm text-muted-foreground">
                Try adjusting your search terms
              </div>
            </div>
          ) : filteredPosts.length === 0 && posts?.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <div className="text-muted-foreground mb-2">No data available</div>
              <div className="text-sm text-muted-foreground">
                <a
                  href="https://github.com/dvuzu/monkrus-search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-link hover:text-link/80"
                >
                  <ExternalLink className="w-3 h-3" />
                  Check data source
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post, index) => (
                <PostCard key={`${post.link}-${index}`} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
