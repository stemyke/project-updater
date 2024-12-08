import {exec} from 'child_process';
import {join, resolve} from 'path';
import {deleteSync} from 'del';
import {existsSync, renameSync} from 'fs';
import {program} from 'commander';
import watch from 'node-watch';
import {copy} from './copy.mjs';

program
    .version('0.1.8', '-v, --version')
    .option('-b, --skip-build', 'Skip first build')
    .option('-m, --modules', 'Copy node modules to project')
    .option('-p, --project [path]', 'Project path where "project-updater" is used')
    .parse(process.argv);

const options = program.opts();
const projectPath = typeof options.project !== 'string' ? null : resolve(options.project);
const noProject = !projectPath;

let child = null;
let deploy = null;

function deployToProject() {
    if (noProject) return;
    const ownerPath = join(projectPath, 'node_modules', '@stemy');
    const distPath = join(ownerPath, 'dist');
    deploy = copy('./dist/**', distPath, 'dist folder to project');
    return deploy.then(() => {
        const targetPath = join(ownerPath, 'project-updater');
        if (existsSync(targetPath)) {
            deleteSync(targetPath, {force: true});
        }
        renameSync(distPath, targetPath);
    });
}

function build(cb = new Function("void 0")) {
    if (child) {
        child.kill();
    }
    if (deploy) {
        deploy.cancel();
    }
    if (options.skipBuild) {
        cb();
        return;
    }
    console.log('Build started...');
    child = exec('nx build');
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on('exit', () => {
        console.log('Build ended');
        deployToProject().then(() => {
            if (typeof cb !== 'function') return;
            cb();
        });
    });
}

build(async () => {
    console.log('Watching for file changes started.');
    watch('./src', {delay: 1000, recursive: true, filter: /\.(json|html|scss|ts)$/}, () => build());
    if (!options.modules) return;
    await copy('./node_modules/**', join(projectPath, 'node_modules'), `node modules to project: ${projectPath}`);
});
