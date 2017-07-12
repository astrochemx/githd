'use strict';

import { ExtensionContext, workspace } from 'vscode'
import { createFileProvider, FileProvider } from './model';
import { CommandCenter } from './commands';
import { HistoryViewProvider } from './historyViewProvider';
import { CommittedFilesProvider } from './committedFilesProvider';

export function activate(context: ExtensionContext) {
    let getConfigFn = () => {
        return {
            useExploreView: <boolean>workspace.getConfiguration('githd').get('useExploreView'),
            useTreeView: <boolean>workspace.getConfiguration('githd.exploreView').get('useTreeView'),
            commitsCount: <number>workspace.getConfiguration('githd.logView').get('commitsCount')
        };
    };
    let config = getConfigFn();
    let fileProvider: FileProvider = createFileProvider(config.useExploreView, config.useTreeView);
    let historyViewProvider = new HistoryViewProvider(fileProvider, config.commitsCount);
    let commandCenter = new CommandCenter(fileProvider, historyViewProvider);

    workspace.onDidChangeConfiguration(() => {
        let newConfig = getConfigFn();
        if (newConfig.useExploreView !== config.useExploreView) {
            let ref = fileProvider.ref;
            fileProvider.dispose();
            fileProvider = createFileProvider(newConfig.useExploreView, newConfig.useTreeView);
            historyViewProvider.fileProvider = fileProvider;
            commandCenter.fileProvider = fileProvider;
            context.subscriptions.push(fileProvider);
            fileProvider.update(ref);
        } else if (config.useExploreView && newConfig.useTreeView !== config.useTreeView) {
            (fileProvider as CommittedFilesProvider).useTreeView = newConfig.useTreeView;
        }
        historyViewProvider.commitsCount = newConfig.commitsCount;
        config = newConfig;
    }, null, context.subscriptions);

    context.subscriptions.push(commandCenter, historyViewProvider, fileProvider);
}

export function deactivate() {
}
