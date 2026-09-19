export const postKeys = {
  all: ["posts"] as const,
  feed: ["posts", "feed"] as const,
  thread: (postId: string) => ["posts", "thread", postId] as const,
  replies: (postId: string) => ["posts", "replies", postId] as const,
  byUser: (username: string) => ["posts", "user", username.toLowerCase()] as const,
};
