import { readFile, unlink, writeFile, stat, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { diffAsText } from 'unidiff';
import { Subject } from 'rxjs';
import { promiseTimeout, readDirRecursive } from './utils';
import { ProjectFile, FileUpdater, MainUpdater, UpdateEvent } from './common-types';

export class ProjectUpdater extends Subject<UpdateEvent> implements MainUpdater {

    readonly path: string;
    protected isCanceled: boolean;
    protected projectFiles: ProjectFile[];

    constructor(path: string, protected updaters: FileUpdater[], protected skipDirs: string[] = ['node_modules']) {
        super();
        this.path = path.replace(/\\/g, '/').replace(/\/$/, '') + '/';
        this.init();
    }

    async update(): Promise<void> {
        this.init();
        const stats = await stat(this.path);
        if (!stats.isDirectory()) {
            this.next({
                type: 'query',
                progress: 0,
                title: `The path ${this.path} is not a directory.`
            });
            return;
        }
        this.next({
            type: 'query',
            progress: 0,
            title: `Initializing...`
        });
        try {
            await this.updateFiles();
            this.next({
                type: 'query',
                progress: 1000,
                title: `Update finished.`
            });
        } catch (e) {
            this.next({
                type: 'query',
                progress: 0,
                title: `An error occurred. ${e}`
            });
            this.init();
        }
    }

    cancel(): void {
        this.init(true);
    }

    exists(path: string): boolean {
        return this.projectFiles.some(f => f.path === path);
    }

    readDir(path: string, recursive: boolean = false): string[] {
        return this.projectFiles.filter(f => {
            const dir = dirname(f.path);
            return dir === path || (recursive && dir.startsWith(path));
        }).map(f => f.path);
    }

    readFile(path: string): string {
        return this.projectFiles.find(f => f.path === path)?.current || '';
    }

    deleteFile(path: string) {
        this.addFile(path, '');
    }

    addFile(path: string, content: string): void {
        let file = this.projectFiles.find(f => f.path === path);
        if (!file) {
            file = {path, previous: '', current: content};
            this.projectFiles.push(file);
        } else if (file.current !== content) {
            file.previous = file.current;
            file.current = content;
        }
        if (file.previous === file.current) return;
        let aname = `a/${path}`;
        let bname = `b/${path}`;
        let change = ``;
        if (!file.previous) {
            change = `new`;
        } else if (!file.current) {
            change = `deleted`;
        }
        const diff= (change ? `diff --git a/${path} b/${path}\n${change} file mode 100644\n` : ``)
            + diffAsText(file.previous, file.current, { aname, bname });
        this.next({
            type: 'file',
            path,
            diff
        });
    }

    async writeChanges(): Promise<void> {
        await promiseTimeout(1500);
        for (const file of this.projectFiles) {
            if (file.previous === file.current) continue;
            await promiseTimeout(10);
            const absPath = resolve(this.path, file.path);
            // Ensure directory exists
            const dir = dirname(absPath);
            const stats = await stat(dir).catch(() => null);
            if (!stats?.isDirectory()) {
                await mkdir(dir, { recursive: true });
            }
            if (!file.current) {
                await unlink(absPath);
                continue;
            }
            await writeFile(absPath, file.current);
        }
    }

    protected async updateFiles(): Promise<void> {
        const files = await readDirRecursive(this.path, this.skipDirs);
        const length = files.length;
        this.next({
            type: 'query',
            progress: 0,
            title: `Reading files...`
        });
        await promiseTimeout(100);
        for (let i = 0; i < length; i++) {
            const path = files[i].replace(/\\/g, '/');
            const current = await readFile(resolve(this.path, files[i]), 'utf-8');
            this.projectFiles.push({ path, current, previous: current });
        }
        this.next({
            type: 'query',
            progress: 0,
            title: `Updating files...`
        });
        await promiseTimeout(100);
        for (let i = 0; i < length; i++) {
            const {path, current} = this.projectFiles[i];
            let result = current;
            for (let updater of this.updaters) {
                if (updater.supports(path)) {
                    result = await updater.update(result, path, this);
                    break;
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
            this.addFile(path, result);
        }
    }

    protected init(canceled: boolean = false): void {
        this.isCanceled = canceled;
        this.projectFiles = [];
    }
}
