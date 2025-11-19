import api from "./api";

export interface DivUser {
  id: number;
  name: string;
  user_id: number;
  linked_user_name?: string;
  linked_user_email?: string;
  created_at: string;
}

export const divUserService = {
  getAllDivUsers: async () => {
    const response = await api.get<{ divUsers: DivUser[] }>("/divusers");
    return response.data.divUsers;
  },

  getDivUserById: async (id: number) => {
    const response = await api.get<{ divUser: DivUser }>(`/divusers/${id}`);
    return response.data.divUser;
  },

  createDivUser: async (divUserData: { name: string; user_id: number }) => {
    const response = await api.post("/divusers", divUserData);
    return response.data;
  },

  updateDivUser: async (id: number, divUserData: Partial<DivUser>) => {
    const response = await api.put(`/divusers/${id}`, divUserData);
    return response.data;
  },

  deleteDivUser: async (id: number) => {
    const response = await api.delete(`/divusers/${id}`);
    return response.data;
  },
};
