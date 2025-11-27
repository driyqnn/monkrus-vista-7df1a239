export interface Post {
  title: string;
  link: string;
  links: string[];
}

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}