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

export function updateSavedData(data: Record<number, string[]>, album_id: number, files: string[]): Record<number, string[]> {
    data[album_id] = data[album_id]
        ? [...data[album_id], ...files]
        : files;

    return data;
}

export function logger(...args: any) {
    console.log(`[${new Date().toLocaleString()}]`, args);
}
