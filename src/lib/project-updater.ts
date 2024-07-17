import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { statSync } from 'fs';
import { join, resolve } from 'path';
import { diffLines, formatLines } from 'unidiff';
import { Subject } from 'rxjs';
import { TsUpdater } from './ts-updater';
import { promiseTimeout } from './utils';
import { existsSync } from 'node:fs';

async function readDirRecursive(dir: string): Promise<string[]> {
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

export interface UpdateProgressEvent {
    progress: number;
    type: 'query' | 'determinate';
    title?: string;
}

export interface UpdateFileEvent {
    type: 'file';
    path: string;
    diff: string;
}

export type UpdateEvent = UpdateProgressEvent | UpdateFileEvent;

export interface ChangedFile {
    absPath: string;
    content: string;
}

export class ProjectUpdater extends Subject<UpdateEvent> {
    protected src: string;
    protected tsUpdater: TsUpdater;
    protected isCanceled: boolean;
    protected changedFiles: ChangedFile[];

    constructor(path: string) {
        super();
        this.src = resolve(path, 'src');
        if (!existsSync(this.src) || !statSync(this.src).isDirectory()) {
            this.src = resolve(path);
        }
        this.tsUpdater = new TsUpdater();
        this.isCanceled = false;
        this.changedFiles = [];
    }

    async update(): Promise<void> {
        this.isCanceled = false;
        this.changedFiles = [];
        this.next({
            type: 'query',
            progress: 0,
            title: `Processing files...`
        });
        const files = await readDirRecursive(this.src);
        const length = files.length;
        await promiseTimeout(1500);
        for (let i = 0; i < length; i++) {
            const absPath = files[i];
            const src = await readFile(absPath, 'utf-8');
            let result = src;
            const ext = absPath.split('.').pop();
            switch (ext) {
                case 'ts':
                    result = await this.tsUpdater.update(src, absPath);
                    break;
            }
            if (this.isCanceled) {
                break;
            }
            const path = absPath.replace(this.src, '').replace(/\\/g, '/');
            this.next({
                type: 'determinate',
                progress: (i + 1) / length,
                title: `Updating ${path}...`
            });
            const diff = formatLines(diffLines(src, result), {
                aname: absPath,
                bname: absPath
            }) as string;
            if (diff.length > 0) {
                this.changedFiles.push({ absPath, content: result });
                this.next({
                    type: 'file',
                    path,
                    diff
                });
            }
        }
        await promiseTimeout(500);
    }

    cancel(): void {
        this.isCanceled = true;
        this.changedFiles = [];
    }

    async writeChanges(): Promise<void> {
        for (const file of this.changedFiles) {
            await writeFile(file.absPath, file.content);
        }
    }
}
