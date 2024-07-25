import { Project, SourceFile } from 'ts-morph';
import { HTMLElement } from 'node-html-parser';

export {SourceFile} from "ts-morph";
export {HTMLElement} from "node-html-parser";

export interface MainUpdater {
    readonly path: string;
    exists(path: string): boolean;
    readDir(path: string, recursive: boolean): string[];
    readFile(path: string): string;
    deleteFile(path: string): void;
    addFile(path: string, content: string): void;
}

export type UpdaterPlugin<NodeType> = (node: NodeType, path: string, main: MainUpdater) => NodeType | void | null;

export type TSUpdaterPlugin = UpdaterPlugin<SourceFile>;
export type HTMLUpdaterPlugin = UpdaterPlugin<HTMLElement>;
export type JSONUpdaterPlugin = UpdaterPlugin<Object>;
export type TextUpdaterPlugin = UpdaterPlugin<string[]>;

export interface FileUpdater {
    supports: (path: string) => boolean;
    update: (src: string, path: string, main: MainUpdater) => Promise<string>;
}

export interface TSUpdaterContext extends FileUpdater {
    readonly project: Project;
}

export interface JSONUpdaterContext extends FileUpdater {
    readonly indent: string;
    readonly eol: string;
}

export interface TextUpdaterContext extends FileUpdater {
    readonly eol: string;
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

export interface ProjectFile {
    path: string;
    content: string;
}
