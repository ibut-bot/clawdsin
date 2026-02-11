import NextAuth from "next-auth";
import Twitter from "next-auth/providers/twitter";

declare module "next-auth" {
  interface Session {
    username?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [Twitter],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        // Twitter OAuth 2.0 profile includes data.username
        const twitterProfile = profile as { data?: { username?: string } };
        token.username = twitterProfile.data?.username;
      }
      return token;
    },
    async session({ session, token }) {
      session.username = token.username as string | undefined;
      return session;
    },
  },
});
