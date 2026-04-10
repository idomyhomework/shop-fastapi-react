import { useState } from "react";
import { useLoginMutation } from "../api";
import { setUser } from "../slice";
import { useAppDispatch } from "../../../store/hooks";

interface Props {
   open: boolean;
}

export default function LoginModal({ open }: Props) {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [login, { isLoading, error }] = useLoginMutation();
   const dispatch = useAppDispatch();

   if (!open) return null;

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         const user = await login({ email, password }).unwrap();
         dispatch(setUser(user));
      } catch {
         // error displayed via RTK error state
      }
   };

   return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
         <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm">
            {/* ── Title ───────────────────────────────────────────────────── */}
            <h2 className="text-xl font-semibold mb-6 text-center">Acceso admin</h2>

            {/* ── Form ────────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
               <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2"
                  required
               />
               <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2"
                  required
               />
               {error && <p className="text-red-500 text-sm text-center">Email o contraseña incorrectos</p>}
               <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-violet-600 text-white rounded-lg py-2 font-medium hover:bg-violet-700 disabled:opacity-50"
               >
                  {isLoading ? "Entrando..." : "Entrar"}
               </button>
            </form>
         </div>
      </div>
   );
}
