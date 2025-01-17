import type { EntityStore } from '../core/store';
import type { SvelteTask } from '../core/task';
export declare class SelectionManager {
    private taskStore;
    _selectedTasks: import("svelte/store").Writable<{
        [taskId: string]: boolean;
        [taskId: number]: boolean;
        [taskId: symbol]: boolean;
    }>;
    constructor(taskStore: EntityStore<SvelteTask>);
    selectSingle(taskId: any): void;
    toggleSelection(taskId: any): void;
    unSelectTasks(): void;
}
