import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { EOL } from 'os';

export function promiseTimeout(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function readDirRecursive(dir: string): Promise<string[]> {
    if (dir.endsWith('node_modules')) {
        return [];
    }
    const files = await readdir(dir);
    const result: string[] = [];
    for (const file of files) {
        const path = join(dir, file);
        const fileStat = await stat(path);
        if (fileStat.isDirectory()) {
            result.push(...(await readDirRecursive(path)));
        } else {
            result.push(path);
        }
    }
    return result;
}

export function getEOL(text: string): string {
    const m = text.match(/\r\n|\n/g);
    const u = m && m.filter(a => a === '\n').length;
    const w = m && m.length - u;
    if (u === w) {
        return EOL; // use the OS default
    }
    return u > w ? '\n' : '\r\n';
}
