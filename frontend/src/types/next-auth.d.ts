import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string; // Add id to the user object
    } & DefaultSession['user'];
  }
}