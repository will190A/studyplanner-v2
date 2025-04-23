import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
  register: async (name, email, password) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      set({ user: data, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    }
  },
}))

interface StudyPlan {
  id: string
  _id?: string
  userId: string
  subjects: string[]
  startDate: string
  endDate: string
  dailyHours: number
  tasks: {
    id: string
    date: string
    subject: string
    description: string
    duration: number
    completed: boolean
  }[]
}

interface PlanState {
  currentPlan: StudyPlan | null
  plans: StudyPlan[]
  setPlan: (plan: StudyPlan) => void
  updateTask: (taskId: string, completed: boolean) => Promise<{ success: boolean; error?: string }>
  savePlan: (plan: StudyPlan) => Promise<{ success: boolean; error?: string }>
  updatePlan: (plan: StudyPlan) => Promise<{ success: boolean; error?: string }>
  deletePlan: (planId: string) => Promise<{ success: boolean; error?: string }>
  fetchPlans: (userId: string) => Promise<{ success: boolean; error?: string; data?: StudyPlan[] }>
  isLoading: boolean
  error: string | null
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      currentPlan: null,
      plans: [],
      isLoading: false,
      error: null,
      setPlan: (plan) => set({ currentPlan: plan, error: null }),
      updateTask: async (taskId, completed) => {
        const currentPlan = get().currentPlan;
        if (!currentPlan) {
          return { success: false, error: 'No plan found' };
        }

        const planId = currentPlan._id || currentPlan.id;
        if (!planId) {
          return { success: false, error: 'Plan ID is missing' };
        }

        try {
          const response = await fetch(`/api/plans/${planId}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, error: data.error };
          }

          const data = await response.json();
          
          // 更新当前计划
          set((state) => ({
            currentPlan: data
          }));
          
          return { success: true };
        } catch (error) {
          return { success: false, error: 'Failed to update task' };
        }
      },
      savePlan: async (plan) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch('/api/plans', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(plan),
          });

          const data = await response.json();

          if (!response.ok) {
            set({ error: data.error });
            return { success: false, error: data.error };
          }

          // 确保返回的数据包含 id
          if (!data._id && !data.id) {
            console.error('Plan saved but missing ID:', data);
            return { success: false, error: 'Plan saved but missing ID' };
          }

          const savedPlan = {
            ...data,
            id: data._id || data.id,
            _id: data._id || data.id
          };

          set((state) => ({
            currentPlan: savedPlan,
            plans: [...state.plans, savedPlan],
            error: null,
          }));
          return { success: true, data: savedPlan };
        } catch (error) {
          console.error('Error saving plan:', error);
          set({ error: 'Failed to save plan' });
          return { success: false, error: 'Failed to save plan' };
        } finally {
          set({ isLoading: false });
        }
      },
      updatePlan: async (plan) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(`/api/plans/${plan.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(plan),
          });

          const data = await response.json();

          if (!response.ok) {
            set({ error: data.error });
            return { success: false, error: data.error };
          }

          set((state) => ({
            currentPlan: data,
            plans: state.plans.map((p) => (p.id === data.id ? data : p)),
            error: null,
          }));
          return { success: true };
        } catch (error) {
          set({ error: 'Failed to update plan' });
          return { success: false, error: 'Failed to update plan' };
        } finally {
          set({ isLoading: false });
        }
      },
      deletePlan: async (planId) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(`/api/plans/${planId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const data = await response.json();
            set({ error: data.error });
            return { success: false, error: data.error };
          }

          set((state) => ({
            currentPlan: state.currentPlan?.id === planId ? null : state.currentPlan,
            plans: state.plans.filter((p) => p.id !== planId),
            error: null,
          }));
          return { success: true };
        } catch (error) {
          set({ error: 'Failed to delete plan' });
          return { success: false, error: 'Failed to delete plan' };
        } finally {
          set({ isLoading: false });
        }
      },
      fetchPlans: async (userId) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(`/api/plans?userId=${userId}`);
          const data = await response.json();

          if (!response.ok) {
            set({ error: data.error });
            return { success: false, error: data.error };
          }

          set({ plans: data, error: null });
          return { success: true, data };
        } catch (error) {
          set({ error: 'Failed to fetch plans' });
          return { success: false, error: 'Failed to fetch plans' };
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'study-plan-storage',
      partialize: (state) => ({ currentPlan: state.currentPlan, plans: state.plans }),
    }
  )
) 