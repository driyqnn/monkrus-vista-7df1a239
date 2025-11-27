interface ResultCounterProps {
  count: number;
  total: number;
  loading?: boolean;
}

export function ResultCounter({ count, total, loading = false }: ResultCounterProps) {
  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground">
      {count === total ? (
        <span>{count} result{count !== 1 ? 's' : ''}</span>
      ) : (
        <span>{count} of {total} result{count !== 1 ? 's' : ''}</span>
      )}
    </div>
  );
}