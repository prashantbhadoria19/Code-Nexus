export type IndexStatus = "PENDING" | "INDEXING" | "READY" | "FAILED";

export type Repository = {
  id: string;
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  isPrivate: boolean;
  defaultBranch: string;
  language: string | null;
  htmlUrl: string | null;
  description: string | null;
  indexStatus: IndexStatus;
  indexedAt: string | null;
  chunkCount: number;
  filesTotal: number;
  filesProcessed: number;
  errorMessage: string | null;
};

export type Citation = {
    filePath: string;
    startLine?: number | null;
    endLine?: number | null;
};

export type ChatMessage = {
    id: string;
    role: "USER" | "ASSISTANT" | "SYSTEM";
    content: string;
    citations?: Citation[];
    createdAt: string;
};

export type ChatSession = {
    id: string;
    title: string;
    createdAt: string;
};

export type IndexStatusResponse = {
  repositoryId: string;
  indexStatus: IndexStatus;
  filesTotal: number;
  filesProcessed: number;
  chunkCount: number;
  indexedAt: string | null;
  errorMessage: string | null;
};

export type User = {
    id:string,
    githubId:number,
    githubUsername:string,
    displayName:string,
    avatarUrl: string | null
}

export class ApiError extends Error{
    status:number;

    constructor(status:number,message:string){
        super(message);
        this.status = status;
    }
}

export function getApiBaseUrl(){
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
}

async function parseError(res: Response): Promise<string> {
    try {
        const data = await res.json();
        return data.message ?? data.error ?? res.statusText;
    } catch {
        return res.statusText || "Request failed";
    }
}

export async function apiFetch<T>(
    path: string,
    init?: RequestInit
): Promise<T> {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
        ...init,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ??{}),
        },
    });

    if (!res.ok) {
        throw new ApiError(res.status, await parseError(res));
    }

    if (res.status === 204) {
        return undefined as T;
    }

    return res.json() as Promise<T>;
}

export function getGithubLoginUrl(){
    return `${getApiBaseUrl()}/oauth2/authorization/github`;
}

export type ApiClient = {
    session: () => Promise<User | null>;
    me: () => Promise<User>;
    logout: () => Promise<void>;
    listRepos: (refresh?: boolean) => Promise<Repository[]>;
    getRepo: (id: string) => Promise<Repository>;
    startIndex: (id: string) => Promise<Repository>;
    indexStatus: (id: string) => Promise<IndexStatusResponse>;
    listSessions: (repositoryId: string) => Promise<ChatSession[]>;
    createSession: (repositoryId: string, title?: string) => Promise<ChatSession>;
    getMessages: (sessionId: string) => Promise<ChatMessage[]>;
};

export const api: ApiClient = {
    session: () => apiFetch<User | null>("/api/auth/session"),
    me: () => apiFetch<User>("/api/auth/me"),
    logout: () =>
        apiFetch<void>("/api/auth/logout", {
            method: "POST"
        }),

    listRepos: (refresh = true) =>
    apiFetch<Repository[]>(`/api/repos?refresh=${refresh}`),
    getRepo: (id: string) => apiFetch<Repository>(`/api/repos/${id}`),
    startIndex: (id: string) =>
        apiFetch<Repository>(`/api/repos/${id}/index`, { method: "POST" }),
    indexStatus: (id: string) =>
    apiFetch<IndexStatusResponse>(`/api/repos/${id}/status`),
    listSessions: (repositoryId: string) =>
        apiFetch<ChatSession[]>(`/api/chat/sessions?repositoryId=${encodeURIComponent(repositoryId)}`),
    createSession: (repositoryId: string, title?: string) =>
        apiFetch<ChatSession>(`/api/chat/sessions`, {
            method: "POST",
            body: JSON.stringify({ repositoryId, title }),
        }),
    getMessages: getChatMessages,
}

// Chat API
export async function listChatSessions(repositoryId: string) {
    return apiFetch<ChatSession[]>(`/api/chat/sessions?repositoryId=${encodeURIComponent(repositoryId)}`);
}

export async function createChatSession(repositoryId: string, title?: string) {
    return apiFetch<ChatSession>(`/api/chat/sessions`, {
        method: "POST",
        body: JSON.stringify({ repositoryId, title }),
    });
}

export async function getChatMessages(sessionId: string) {
    return apiFetch<ChatMessage[]>(`/api/chat/sessions/${encodeURIComponent(sessionId)}`);
}

// Backwards-compatible exports used by client hooks
export const chatApi = {
    listSessions: listChatSessions,
    createSession: createChatSession,
    getMessages: getChatMessages,
};
