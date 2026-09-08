import { apiFetch } from './client';

export function listGames(): Promise<any> {
  return apiFetch('/games');
}

export function listGamesAdmin(): Promise<any> {
  return apiFetch('/games/admin');
}

export function createGame(data: unknown): Promise<any> {
  return apiFetch('/games', { method: 'POST', body: JSON.stringify(data) });
}

export function updateGame(id: string, data: unknown): Promise<any> {
  return apiFetch(`/games/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteGame(id: string): Promise<any> {
  return apiFetch(`/games/${id}`, { method: 'DELETE' });
}
