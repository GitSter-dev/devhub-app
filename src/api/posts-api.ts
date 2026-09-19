import type { KyInstance } from "ky";

import { unwrap } from "./http-client";
import { idempotencyHeaders } from "./idempotency";

export type Post = {
  id: string;
  author: { id: string; username: string; displayName: string };
  body: string | null;
  code: string | null;
  codeLanguage: string | null;
  createdAt: string;
  replyToId: string | null;
  replyToUsername: string | null;
  replyToDeleted: boolean;
  rootId: string | null;
  replyCount: number;
  likeCount: number;
  liked: boolean;
  mine: boolean;
  deleted: boolean;
  removed: boolean;
  underReview: boolean;
};

export type PostPage = {
  items: Post[];
  nextCursor: string | null;
};

export type Thread = {
  post: Post;
  ancestors: Post[];
};

export type NewPost = {
  body: string | null;
  code: string | null;
  codeLanguage: string | null;
  replyToId: string | null;
};

function page(cursor: string | null): { searchParams: Record<string, string> } {
  return { searchParams: cursor ? { cursor } : {} };
}

export function fetchFeed(client: KyInstance, cursor: string | null): Promise<PostPage> {
  return unwrap<PostPage>(client.get("feed", page(cursor)));
}

export function fetchThread(client: KyInstance, postId: string): Promise<Thread> {
  return unwrap<Thread>(client.get(`posts/${postId}`));
}

export function fetchReplies(client: KyInstance, postId: string, cursor: string | null): Promise<PostPage> {
  return unwrap<PostPage>(client.get(`posts/${postId}/replies`, page(cursor)));
}

export function fetchUserPosts(client: KyInstance, username: string, cursor: string | null): Promise<PostPage> {
  return unwrap<PostPage>(client.get(`users/${encodeURIComponent(username)}/posts`, page(cursor)));
}

export function createPost(client: KyInstance, post: NewPost, idempotencyKey: string): Promise<Post> {
  return unwrap<Post>(client.post("posts", { json: post, headers: idempotencyHeaders(idempotencyKey) }));
}

export function deletePost(client: KyInstance, postId: string): Promise<void> {
  return unwrap<void>(client.delete(`posts/${postId}`));
}

export function likePost(client: KyInstance, postId: string): Promise<void> {
  return unwrap<void>(client.put(`posts/${postId}/like`));
}

export function unlikePost(client: KyInstance, postId: string): Promise<void> {
  return unwrap<void>(client.delete(`posts/${postId}/like`));
}
