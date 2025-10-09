import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAirlines() {
  return useQuery({
    queryKey: ["airlines"],
    queryFn: async () => {
      const res = await api("/airlines");
      // 🔄 remap DB columns → frontend shape
      return res.map((a: any) => ({
        id: a.airline_id, // map correctly
        name: a.name,
        code: a.airline_iata_code, // map correctly
        country: a.country,
      }));
    },
  });
}

export function useAddAirline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newAirline: any) =>
      api("/airlines", {
        method: "POST",
        body: JSON.stringify(newAirline),
      }),
    // 🔮 Optimistic update
    onMutate: async (newAirline) => {
      await queryClient.cancelQueries({ queryKey: ["airlines"] });

      const previous = queryClient.getQueryData<any[]>(["airlines"]);

      // Add temp ID to show instantly
      const optimisticAirline = {
        id: Date.now(),
        ...newAirline,
      };

      queryClient.setQueryData<any[]>(["airlines"], (old) => [
        ...(old ?? []),
        optimisticAirline,
      ]);

      return { previous };
    },

    // Rollback on error
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["airlines"], ctx.previous);
      }
    },

    // ✅ Final sync
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["airlines"] });
    },
  });
}

export function useDeleteAirline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) =>
      api(`/airlines/${id}`, { method: "DELETE" }),

    // 🔮 Optimistic update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["airlines"] });

      const previous = queryClient.getQueryData<any[]>(["airlines"]);

      // Remove instantly
      queryClient.setQueryData<any[]>(["airlines"], (old) =>
        (old ?? []).filter((a) => a.id !== id)
      );

      return { previous };
    },

    // Rollback on error
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["airlines"], ctx.previous);
      }
    },

    // ✅ Final sync
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["airlines"] });
    },
  });
}
