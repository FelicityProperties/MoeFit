import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Auth.js (NextAuth v5) — Google sign-in for cross-device, account-based data.
// Reads AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, and AUTH_SECRET from the env.
// Only active when NEXT_PUBLIC_GOOGLE_AUTH=true (see lib/store.tsx GOOGLE_AUTH);
// the data layer keys each user's row by their Google email.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  trustHost: true,
  session: { strategy: "jwt" },
});
