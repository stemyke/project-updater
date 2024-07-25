import { EOL } from 'os';
import { BaseUpdater } from './base-updater';
import { TextUpdaterContext, TextUpdaterPlugin } from '../common-types';
import { getEOL } from '../utils';

export class TextUpdater extends BaseUpdater<string[]> implements TextUpdaterContext {

    eol: string;

    constructor(plugins: TextUpdaterPlugin[]) {
        super(plugins);
        this.eol = EOL;
    }

    protected match(): RegExp {
        return /./;
    }

    protected convertToNode(src: string): string[] {
        this.eol = getEOL(src);
        return src?.split(this.eol) || [];
    }

    protected convertFromNode(node: string[]): string {
        return (node || []).join(this.eol) + this.eol;
    }
}
