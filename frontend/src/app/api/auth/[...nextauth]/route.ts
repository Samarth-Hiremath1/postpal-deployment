import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '5432'),
});

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }: { user: any; account: any }) {
      try {
        const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [account.providerAccountId]);
        if (result.rows.length === 0) {
          await pool.query(
            'INSERT INTO users (google_id, email, name) VALUES ($1, $2, $3)',
            [account.providerAccountId, user.email, user.name]
          );
        }
        return true;
      } catch (err) {
        console.error('Sign-in error:', err);
        return false;
      }
    },
    async session({ session, token }: { session: any; token: any }) {
      const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [token.sub]);
      if (result.rows.length > 0) {
        session.user.id = result.rows[0].id.toString();
        session.user.name = result.rows[0].name;
        session.user.email = result.rows[0].email;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };