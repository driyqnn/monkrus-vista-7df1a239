import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 p-3 bg-card/90 backdrop-blur-sm border border-border/50 rounded-full shadow-lg hover:bg-card hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200"
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-5 h-5 text-foreground" />
    </button>
  );
};
