import { TMDBMovie, TMDBTVShow, TMDBSearchResult } from "@shared/schema";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY  || "4eb67347d50b58fcc27c1c9317176eb6";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Helper function to make API requests
async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", TMDB_API_KEY);
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }
  
  console.log(`TMDB API Request: ${endpoint}`);
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    console.error(`TMDB API error: ${response.status} ${response.statusText}`);
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json() as Promise<T>;
}

// Trending movies and TV shows
export async function getTrending(mediaType: "all" | "movie" | "tv" = "all", timeWindow: "day" | "week" = "week"): Promise<TMDBSearchResult> {
  return tmdbFetch<TMDBSearchResult>(`/trending/${mediaType}/${timeWindow}`);
}

// Popular movies
export async function getPopularMovies(page: number = 1): Promise<TMDBSearchResult> {
  return tmdbFetch<TMDBSearchResult>("/movie/popular", { page: page.toString() });
}

// Popular TV shows
export async function getPopularTVShows(page: number = 1): Promise<TMDBSearchResult> {
  return tmdbFetch<TMDBSearchResult>("/tv/popular", { page: page.toString() });
}

// Search for movies and TV shows
export async function searchMulti(query: string, page: number = 1): Promise<TMDBSearchResult> {
  return tmdbFetch<TMDBSearchResult>("/search/multi", { 
    query,
    page: page.toString(),
    include_adult: "false"
  });
}

// Search for movies
export async function searchMovies(query: string, page: number = 1): Promise<TMDBSearchResult> {
  return tmdbFetch<TMDBSearchResult>("/search/movie", { 
    query,
    page: page.toString(),
    include_adult: "false"
  });
}

// Search for TV shows
export async function searchTVShows(query: string, page: number = 1): Promise<TMDBSearchResult> {
  return tmdbFetch<TMDBSearchResult>("/search/tv", { 
    query,
    page: page.toString(),
    include_adult: "false"
  });
}

// Get movie details
export async function getMovieDetails(id: number): Promise<TMDBMovie & { runtime: number }> {
  return tmdbFetch<TMDBMovie & { runtime: number }>(`/movie/${id}`);
}

// Get TV show details
export async function getTVShowDetails(id: number): Promise<TMDBTVShow & { episode_run_time: number[] }> {
  return tmdbFetch<TMDBTVShow & { episode_run_time: number[] }>(`/tv/${id}`);
}

// Search for movies and TV shows for adding to lists
export async function searchMedia(query: string) {
  if (!query.trim()) {
    return [];
  }

  try {
    const result = await searchMulti(query);
    
    // Filter to only movies and TV shows, and transform to our format
    return result.results
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => {
        const isMovie = item.media_type === 'movie';
        return {
          id: item.id,
          title: isMovie ? item.title : item.name,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          media_type: item.media_type,
          release_date: isMovie ? item.release_date : item.first_air_date,
          overview: item.overview,
          vote_average: item.vote_average,
        };
      });
  } catch (error) {
    console.error("Error searching media:", error);
    throw error;
  }
}

// Get movie recommendations
export async function getMovieRecommendations(id: number): Promise<TMDBSearchResult> {
  return tmdbFetch<TMDBSearchResult>(`/movie/${id}/recommendations`);
}

// Get TV show recommendations
export async function getTVShowRecommendations(id: number): Promise<TMDBSearchResult> {
  return tmdbFetch<TMDBSearchResult>(`/tv/${id}/recommendations`);
}

// Get movie genres
export async function getMovieGenres(): Promise<{ genres: { id: number; name: string }[] }> {
  return tmdbFetch<{ genres: { id: number; name: string }[] }>("/genre/movie/list");
}

// Get TV show genres
export async function getTVGenres(): Promise<{ genres: { id: number; name: string }[] }> {
  return tmdbFetch<{ genres: { id: number; name: string }[] }>("/genre/tv/list");
}

// Discover movies by genre
export async function discoverMoviesByGenre(genreId: number, page: number = 1): Promise<TMDBSearchResult> {
  return tmdbFetch<TMDBSearchResult>("/discover/movie", {
    with_genres: genreId.toString(),
    page: page.toString(),
    sort_by: "popularity.desc"
  });
}

// Discover TV shows by genre
export async function discoverTVShowsByGenre(genreId: number, page: number = 1): Promise<TMDBSearchResult> {
  return tmdbFetch<TMDBSearchResult>("/discover/tv", {
    with_genres: genreId.toString(),
    page: page.toString(),
    sort_by: "popularity.desc"
  });
}
