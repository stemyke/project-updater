import { EOL } from 'os';
import detectIndent from 'detect-indent';
import { BaseUpdater } from './base-updater';
import { JSONUpdaterContext, JSONUpdaterPlugin } from '../common-types';
import { getEOL } from '../utils';

export class JSONUpdater extends BaseUpdater<Object> implements JSONUpdaterContext {

    indent: string;
    eol: string;

    constructor(plugins: JSONUpdaterPlugin[]) {
        super(plugins);
        this.indent = '    ';
        this.eol = EOL;
    }

    protected match(): RegExp {
        return /\.json$/;
    }

    protected convertToNode(src: string): Object {
        this.indent = detectIndent(src).indent || this.indent;
        this.eol = getEOL(src);
        return JSON.parse(src);
    }

    protected convertFromNode(node: Object): string {
        return JSON.stringify(node, undefined, this.indent)
            .replace(/\n/g, this.eol) + this.eol;
    }
}
