import { promiseTimeout } from '../utils';
import { FileUpdater, MainUpdater, UpdaterPlugin } from '../common-types';

export abstract class BaseUpdater<NodeType> implements FileUpdater {

    protected plugins: UpdaterPlugin<NodeType>[];

    protected constructor(plugins: UpdaterPlugin<NodeType>[]) {
        this.plugins = plugins.map(p => p.bind(this));
    }

    supports(path: string): boolean {
        return path.match(this.match()) !== null;
    }

    async update(src: string, path: string, main: MainUpdater): Promise<string> {
        const original = this.convertFromNode(
            this.convertToNode(src, path),
            path
        );
        let node = this.convertToNode(src, path);
        for (const plugin of this.plugins) {
            await promiseTimeout(5);
            const result = plugin(node, path, main);
            if (result === null) {
                return '';
            }
            if (result) {
                node = result;
            }
        }
        const result = this.convertFromNode(node, path);
        return result === original ? src : result;
    }

    protected abstract match(): RegExp;

    protected abstract convertToNode(src: string, path: string): NodeType;

    protected abstract convertFromNode(node: NodeType, path: string): string;
}
