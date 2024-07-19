import { Project, SourceFile } from 'ts-morph';
import { HTMLElement } from 'node-html-parser';

export {SourceFile} from "ts-morph";
export {HTMLElement} from "node-html-parser";

export interface MainUpdater {
    addFile(absPath: string, content: string): void;
}

export type UpdaterPlugin<NodeType> = (node: NodeType, path: string, main: MainUpdater) => NodeType | void | null;

export type TSUpdaterPlugin = UpdaterPlugin<SourceFile>;
export type HTMLUpdaterPlugin = UpdaterPlugin<HTMLElement>;
export type JSONUpdaterPlugin = UpdaterPlugin<Object>;

export interface FileUpdater {
    supports: (path: string) => boolean;
    update: (src: string, path: string, main: MainUpdater) => Promise<string>;
}

export interface TSUpdaterContext extends FileUpdater {
    readonly project: Project;
}

export interface JSONUpdaterContext extends FileUpdater {
    readonly lastIndent: string;
}

export interface HTMLUpdaterContext extends FileUpdater {
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
