export interface SourcePathGenerator {
    username: string,
    folder: string;
    filename: string;
    volume?: string;
}

export const sourcePath = ({
        username,
        folder,
        volume,
        filename
    }: SourcePathGenerator
    
) => `/homes/${username}/Photos${folder}/${filename}`

export const destPath = (folderName: string, username: string) => `/photo/${folderName}${username ? '/' + username : ''}`;

export function customDelay(millisec: number) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, millisec);
    })
}

export function savedDataIndex(album_id: number, shared_folder: string): string {
    return `${album_id}_${shared_folder}`;
}

export function updateSavedData(data: Record<string, string[]>, album_id: number, shared_folder: string, files: string[]): Record<string, string[]> {
    const index: string = savedDataIndex(album_id, shared_folder);

    data[index] = data[index]
        ? [...data[index], ...files]
        : files;

    return data;
}

export function logger(...args: any) {
    console.log(`[${new Date().toLocaleString()}]`, args);
}
