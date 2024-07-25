import { Project, SourceFile } from 'ts-morph';
import { BaseUpdater } from './base-updater';
import { TSUpdaterContext, TSUpdaterPlugin } from '../common-types';

export class TSUpdater extends BaseUpdater<SourceFile> implements TSUpdaterContext {
    readonly project: Project;

    constructor(plugins: TSUpdaterPlugin[]) {
        super(plugins)
        this.project = new Project({
            skipAddingFilesFromTsConfig: true,
            useInMemoryFileSystem: true,
        });
    }

    protected match(): RegExp {
        // Match both ts and tsx files
        return /\.tsx?$/;
    }

    protected convertToNode(src: string, path: string): SourceFile {
        return this.project.createSourceFile(path, src, {overwrite: true});
    }

    protected convertFromNode(node: SourceFile): string {
        return node.getText(true);
    }
}
