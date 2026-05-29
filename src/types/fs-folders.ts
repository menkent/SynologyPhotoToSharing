export interface FSFile {
    isdir: boolean;
    name: string;
    path: string;
}

export interface FSFolderCreateResponse {
    folders: Array<FSFile>;
}

export interface FSFolderCreateRequest {
    folder_path: string;
    name: string;
    force_parent: boolean;
}

export interface FSRenameRequest {
    path: string;
    name: string;
}

export interface FSRenameResponse {
    files: Array<FSFile>;
}

export interface FSListRequest {
    folder_path: string;
    offset: number;
    limit: number;
}

export interface FSListResponse {
    files: Array<FSFile>;
    total: number;
    offset: number;
}