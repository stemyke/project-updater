import { promiseTimeout } from '../utils';
import { FileUpdater, UpdaterPlugin } from '../common-types';

export abstract class BaseUpdater<NodeType> implements FileUpdater {

    protected constructor(protected plugins: UpdaterPlugin<NodeType>[]) {

    }

    supports(path: string): boolean {
        return path.endsWith(this.extension());
    }

    async update(src: string, path: string): Promise<string> {
        let node = this.convertToNode(src, path);
        for (const plugin of this.plugins) {
            await promiseTimeout(5);
            const result = plugin.call(this, node, path);
            if (result === null) {
                return '';
            }
            if (result) {
                node = result;
            }
        }
        return this.convertFromNode(node, path);
    }

    protected abstract extension(): string;

    protected abstract convertToNode(src: string, path: string): NodeType;

    protected abstract convertFromNode(node: NodeType, path: string): string;
}