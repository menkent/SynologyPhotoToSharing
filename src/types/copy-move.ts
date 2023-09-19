export interface CopyMoveFSResponse {
    taskid: string;
}

export interface CopyMoveFSRequest {
    path: string;
    dest_folder_path: string;
    overwrite?: boolean;
    remove_src?: boolean
    accurate_progress?: boolean;
    search_taskid?: string;
}

export interface CopyMoveStatusFSResponse {
    finished: boolean;
}

export interface CopyMoveStatusFSRequest {
    taskid: string;
}