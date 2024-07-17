import { readFile, writeFile } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { resolve } from 'path';
import { diffLines, formatLines } from 'unidiff';
import { Subject } from 'rxjs';
import { promiseTimeout, readDirRecursive } from './utils';
import { ChangedFile, FileUpdater, UpdateEvent } from './common-types';

export class ProjectUpdater extends Subject<UpdateEvent> {
    protected src: string;
    protected isCanceled: boolean;
    protected changedFiles: ChangedFile[];

    constructor(path: string, protected updaters: FileUpdater[]) {
        super();
        this.src = resolve(path, 'src');
        if (!existsSync(this.src) || !statSync(this.src).isDirectory()) {
            this.src = resolve(path);
        }
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
        await promiseTimeout(1000);
        for (let i = 0; i < length; i++) {
            const absPath = files[i];
            const path = absPath.replace(this.src, '').replace(/\\/g, '/');
            const src = await readFile(absPath, 'utf-8');
            let result = src;
            for (let updater of this.updaters) {
                if (updater.supports(path)) {
                    await promiseTimeout(15);
                    result = await updater.update(src, absPath);
                }
            }
            if (this.isCanceled) {
                break;
            }
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
            await promiseTimeout(10);
            await writeFile(file.absPath, file.content);
        }
    }
}
