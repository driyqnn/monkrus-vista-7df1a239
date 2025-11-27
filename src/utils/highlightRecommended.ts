const RECOMMENDED_DOMAINS = ['pb.wtf', 'uztracker.net'];

export function isRecommendedMirror(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return RECOMMENDED_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    // If URL is invalid, treat as not recommended
    return false;
  }
}

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}