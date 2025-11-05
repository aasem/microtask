import api from './api';

export interface Tag {
  id: number;
  name: string;
  created_at?: string;
}

export const tagService = {
  // Get all tags
  getAllTags: async (): Promise<Tag[]> => {
    const response = await api.get('/tags');
    return response.data.tags;
  },

  // Create a new tag
  createTag: async (name: string): Promise<Tag> => {
    const response = await api.post('/tags', { name });
    return response.data.tag;
  },

  // Delete a tag (admin only)
  deleteTag: async (id: number): Promise<void> => {
    await api.delete(`/tags/${id}`);
  },
};
