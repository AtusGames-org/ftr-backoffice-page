import { apiRequest } from './apiClient';

export interface CharacterInfoResponse {
  character_name: string;
  character_bio: string;
  category_sprites: Record<string, string>;
}

export const getCharacterInfo = async (userId: string): Promise<CharacterInfoResponse> =>
  apiRequest<CharacterInfoResponse>(`/player/character/${userId}`);
