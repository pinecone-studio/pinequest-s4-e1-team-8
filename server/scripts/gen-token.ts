import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

const userId =
  process.env.CLERK_TEST_USER_ID ??
  (await clerk.users.getUserList({ limit: 1 })).data[0]!.id;

const session = await clerk.sessions.createSession({ userId });
const { jwt } = await clerk.sessions.getToken(session.id, undefined, 60 * 60 * 24);

console.log(jwt);
