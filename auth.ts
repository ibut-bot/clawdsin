import NextAuth from "next-auth";
import Twitter from "next-auth/providers/twitter";

declare module "next-auth" {
  interface Session {
    username?: string;
    profileImage?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [Twitter],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        const twitterProfile = profile as {
          data?: { username?: string; profile_image_url?: string };
        };
        token.username = twitterProfile.data?.username;
        token.profileImage = twitterProfile.data?.profile_image_url;
      }
      return token;
    },
    async session({ session, token }) {
      session.username = token.username as string | undefined;
      session.profileImage = token.profileImage as string | undefined;
      return session;
    },
  },
});
