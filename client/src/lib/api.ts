import { User } from "firebase/auth";

// Base URL for API requests
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5003/api';

// Helper function for making API requests
export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
) {
  console.log(`API Request: ${method} ${API_BASE_URL}${endpoint}`, data);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    console.log(`API Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response;
  } catch (error) {
    console.error(`API Request Error for ${method} ${endpoint}:`, error);
    throw error;
  }
}

// User-related API functions
export async function createOrUpdateUser(user: User) {
  return apiRequest('POST', '/users', {
    id: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
  });
}

// List-related API functions
export async function createList(userId: string, name: string, description?: string, isPublic: boolean = false) {
  return apiRequest('POST', '/lists', {
    userId,
    name,
    description,
    isPublic,
  });
}

export async function getListsByUserId(userId: string) {
  return apiRequest('GET', `/users/${userId}/lists`);
}

export async function getListById(listId: number) {
  return apiRequest('GET', `/lists/${listId}`);
}

// Media-related API functions
export async function addToWatchlist(userId: string, mediaId: number) {
  return apiRequest('POST', '/watchlist', {
    userId,
    mediaId,
  });
}

export async function addToFavorites(userId: string, mediaId: number) {
  return apiRequest('POST', '/favorites', {
    userId,
    mediaId,
  });
}

export async function addToWatched(userId: string, mediaId: number, rating?: number) {
  return apiRequest('POST', '/watched', {
    userId,
    mediaId,
    rating,
  });
} 