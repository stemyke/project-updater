import { parse, HTMLElement } from 'node-html-parser';
import { BaseUpdater } from './base-updater';
import { HTMLUpdaterContext, HTMLUpdaterPlugin } from '../common-types';

export class HTMLUpdater extends BaseUpdater<HTMLElement> implements HTMLUpdaterContext {

    constructor(plugins: HTMLUpdaterPlugin[]) {
        super(plugins)
    }

    protected match(): RegExp {
        // Match both htm and html files
        return /\.html?$/;
    }

    protected convertToNode(src: string): HTMLElement {
        return parse(src, {
            comment: true,
            voidTag: {
                closingSlash: true
            }
        });
    }

    protected convertFromNode(node: HTMLElement): string {
        return node.innerHTML;
    }
}
