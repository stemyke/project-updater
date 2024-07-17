import { parse, HTMLElement } from 'node-html-parser';
import { BaseUpdater } from './base-updater';
import { HTMLUpdaterContext, HTMLUpdaterPlugin } from '../common-types';

export class HTMLUpdater extends BaseUpdater<HTMLElement> implements HTMLUpdaterContext {

    constructor(plugins: HTMLUpdaterPlugin[]) {
        super(plugins)
    }

    protected extension(): string {
        return '.html';
    }

    protected convertToNode(src: string): HTMLElement {
        return parse(`<div>${src}</div>`);
    }

    protected convertFromNode(node: HTMLElement): string {
        return node.outerHTML;
    }
}
