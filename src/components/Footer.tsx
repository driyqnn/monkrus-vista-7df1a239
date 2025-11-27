export function Footer() {
  return (
    <footer className="mt-16 py-8 border-t border-border">
      <div className="container max-w-4xl mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Developed by{' '}
          <a
            href="https://m.me/09sychicc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-link/80 font-medium transition-colors duration-200"
          >
            @09sychic
          </a>
        </p>
      </div>
    </footer>
  );
}