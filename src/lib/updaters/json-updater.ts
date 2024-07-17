import detectIndent from 'detect-indent';
import { BaseUpdater } from './base-updater';
import { JSONUpdaterContext, TSUpdaterPlugin } from '../common-types';

export class JSONUpdater extends BaseUpdater<Object> implements JSONUpdaterContext {

    get lastIndent(): string {
        return this.indent;
    }

    protected indent: string;

    constructor(plugins: TSUpdaterPlugin[]) {
        super(plugins);
        this.indent = '    ';
    }

    protected extension(): string {
        return '.json';
    }

    protected convertToNode(src: string): Object {
        this.indent = detectIndent(src).indent || this.indent;
        return JSON.parse(src);
    }

    protected convertFromNode(node: Object): string {
        return JSON.stringify(node, undefined, this.indent);
    }
}
