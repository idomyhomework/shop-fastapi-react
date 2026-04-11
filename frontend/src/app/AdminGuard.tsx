// ── Admin Guard ────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { useGetMeQuery } from "../features/auth/api";
import { setUser, clearUser } from "../features/auth/slice";
import { useAppDispatch } from "../store/hooks";
import LoginModal from "../features/auth/components/LoginModal";

export function AdminGuard({ children }: { children: React.ReactNode }) {
   const { data: user, isLoading, refetch } = useGetMeQuery();
   const dispatch = useAppDispatch();

   // ── Sync fetched user into Redux ───────────────────────────────────────
   useEffect(() => {
      if (user) {
         dispatch(setUser(user));
      } else if (!isLoading) {
         dispatch(clearUser());
      }
   }, [user, isLoading, dispatch]);

   if (isLoading) {
      return (
         <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500">Cargando...</p>
         </div>
      );
   }

   // ── Not authenticated or not admin → clear state and show login ────────
   if (!user || user.role !== "admin") {
      return <LoginModal open={true} onSuccess={refetch} />;
   }

   return <>{children}</>;
}
