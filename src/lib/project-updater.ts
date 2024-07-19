import { readFile, writeFile, unlink } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { resolve } from 'path';
import { diffLines, formatLines } from 'unidiff';
import { Subject } from 'rxjs';
import { promiseTimeout, readDirRecursive } from './utils';
import { ChangedFile, FileUpdater, MainUpdater, UpdateEvent } from './common-types';

export class ProjectUpdater extends Subject<UpdateEvent> implements MainUpdater {
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
        await promiseTimeout(500);
        for (let i = 0; i < length; i++) {
            const absPath = files[i];
            const path = absPath.replace(this.src, '').replace(/\\/g, '/');
            const src = await readFile(absPath, 'utf-8');
            let result = src;
            for (let updater of this.updaters) {
                if (updater.supports(path)) {
                    await promiseTimeout(10);
                    result = await updater.update(src, absPath, this);
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
            this.addFile(absPath, result, src);
        }
        await promiseTimeout(250);
    }

    cancel(): void {
        this.isCanceled = true;
        this.changedFiles = [];
    }

    addFile(absPath: string, content: string, original: string = ''): void {
        const existing = this.changedFiles.find(f => f.absPath === absPath);
        if (existing) {
            original = existing.content || '';
            existing.content = content;
        } else {
            this.changedFiles.push({ absPath, content });
        }
        const path = absPath.replace(this.src, '').replace(/\\/g, '/');
        const diff = formatLines(diffLines(original, content), {
            aname: absPath,
            bname: absPath
        }) as string;
        if (diff.length === 0) return;
        this.next({
            type: 'file',
            path,
            diff
        });
    }

    async writeChanges(): Promise<void> {
        for (const file of this.changedFiles) {
            await promiseTimeout(10);
            if (!file.content) {
                await unlink(file.absPath);
                continue;
            }
            await writeFile(file.absPath, file.content);
        }
    }
}
