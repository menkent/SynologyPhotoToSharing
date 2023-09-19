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