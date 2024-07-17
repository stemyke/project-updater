import { Project, SourceFile } from 'ts-morph';
import { BaseUpdater } from './base-updater';
import { TSUpdaterContext, TSUpdaterPlugin } from '../common-types';

export class TSUpdater extends BaseUpdater<SourceFile> implements TSUpdaterContext {
    readonly project: Project;

    constructor(plugins: TSUpdaterPlugin[]) {
        super(plugins)
        this.project = new Project({
            skipAddingFilesFromTsConfig: true
        });
    }

    protected extension(): string {
        return '.ts';
    }

    protected convertToNode(_: string, path: string): SourceFile {
        return this.project.addSourceFileAtPath(path);
    }

    protected convertFromNode(node: SourceFile): string {
        return node.getText(true);
    }
}
