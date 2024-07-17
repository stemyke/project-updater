import { promiseTimeout } from './utils';
import { Project } from 'ts-morph';

export class TsUpdater {
    protected project: Project;

    constructor() {
        this.project = new Project({
            skipAddingFilesFromTsConfig: true
        });
        console.log('TsUpdater constructor');
    }

    async update(src: string, path: string): Promise<string> {
        await promiseTimeout(20);
        return this.updateSync(src, path);
    }

    protected updateSync(_: string, path: string): string {
        const sourceFile = this.project.addSourceFileAtPath(path);
        sourceFile.getImportDeclarations().forEach((importDeclaration) => {
            const module = importDeclaration.getModuleSpecifier()?.getText() || '';
            if (module.includes('@metrix/configurator-ui-core')) {
                importDeclaration.getNamedImports().forEach((imp) => {
                    // console.log(imp.getName());
                    importDeclaration.addNamedImport(imp.getStructure());
                });
            }
        });
        sourceFile.getClasses().forEach((classDeclaration) => {
            // console.log(classDeclaration.getName());
            classDeclaration.getDecorators().forEach((decorator) => {
                // console.log(decorator.getName(), decorator.getCallExpression()?.getArguments());
            });
        });
        return sourceFile.getText();
    }
}
