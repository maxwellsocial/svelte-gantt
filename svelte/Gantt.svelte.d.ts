import { SvelteComponentTyped } from "svelte";
import type { SvelteTask, TaskModel } from './core/task';
import type { RowModel, SvelteRow } from './core/row';
import { TimeRangeFactory } from './core/timeRange';
import type { HighlightedDurations, Column as IColumn } from './core/column';
import type { SvelteGanttDateAdapter } from './utils/date';
declare const __propDef: {
    props: {
        [x: string]: any;
        rows: RowModel[];
        tasks?: TaskModel[];
        timeRanges?: any[];
        rowPadding?: number;
        rowHeight?: number;
        from: any;
        to: any;
        minWidth?: number;
        fitWidth?: boolean;
        classes?: any[];
        headers?: {
            unit: string;
            format: string;
        }[];
        zoomLevels?: {
            headers: ({
                unit: string;
                format: string;
                offset?: undefined;
            } | {
                unit: string;
                format: string;
                offset: number;
            })[];
            minWidth: number;
            fitWidth: boolean;
        }[];
        taskContent?: any;
        tableWidth?: number;
        resizeHandleWidth?: number;
        onTaskButtonClick?: any;
        dateAdapter?: SvelteGanttDateAdapter;
        magnetUnit?: string;
        magnetOffset?: number;
        columnUnit?: string;
        columnOffset?: number;
        ganttTableModules?: any[];
        ganttBodyModules?: any[];
        reflectOnParentRows?: boolean;
        reflectOnChildRows?: boolean;
        useCanvasColumns?: boolean;
        columnStrokeColor?: string;
        columnStrokeWidth?: number;
        highlightedDurations: HighlightedDurations;
        highlightColor?: string;
        taskElementHook?: any;
        layout?: "overlap" | "pack" | "expand";
        columnService?: {
            getColumnByDate: (date: number) => IColumn;
            getColumnByPosition: (x: number) => IColumn;
            getPositionByDate(date: number): number;
            getDateByPosition(x: number): number;
            roundTo(date: number): number;
        };
        api?: {
            tasks: {
                on: {
                    move: (handler: (arg: [TaskModel]) => void) => () => void;
                    resize: (handler: (arg: [TaskModel]) => void) => () => void;
                    select: (handler: (arg: [SvelteTask]) => void) => () => void;
                    switchRow: (handler: (arg: [SvelteTask, SvelteRow, SvelteRow]) => void) => () => void;
                    moveEnd: (handler: (arg: [TaskModel]) => void) => () => void;
                    change: (handler: (arg: [{
                        task: SvelteTask;
                        sourceRow: SvelteRow;
                        targetRow: SvelteRow;
                        previousState: any;
                    }]) => void) => () => void;
                    changed: (handler: (arg: [{
                        task: SvelteTask;
                        sourceRow: SvelteRow;
                        targetRow: SvelteRow;
                        previousState: any;
                    }]) => void) => () => void;
                    dblclicked: (handler: (arg: [SvelteTask, MouseEvent]) => void) => () => void;
                };
                raise: {
                    move: (params_0: TaskModel) => void;
                    resize: (params_0: TaskModel) => void;
                    select: (params_0: SvelteTask) => void;
                    switchRow: (params_0: SvelteTask, params_1: SvelteRow, params_2: SvelteRow) => void;
                    moveEnd: (params_0: TaskModel) => void;
                    change: (params_0: {
                        task: SvelteTask;
                        sourceRow: SvelteRow;
                        targetRow: SvelteRow;
                        previousState: any;
                    }) => void;
                    changed: (params_0: {
                        task: SvelteTask;
                        sourceRow: SvelteRow;
                        targetRow: SvelteRow;
                        previousState: any;
                    }) => void;
                    dblclicked: (params_0: SvelteTask, params_1: MouseEvent) => void;
                };
            };
            gantt: {
                on: {
                    viewChanged: (handler: (arg: []) => void) => () => void;
                    dateSelected: (handler: (arg: [{
                        from: number;
                        to: number;
                    }]) => void) => () => void;
                };
                raise: {
                    viewChanged: () => void;
                    dateSelected: (params_0: {
                        from: number;
                        to: number;
                    }) => void;
                };
            };
            timeranges: {
                on: {
                    clicked: (handler: (arg: [{
                        model: import("./core/timeRange").TimeRangeModel;
                    }]) => void) => () => void;
                    resized: (handler: (arg: [{
                        model: import("./core/timeRange").TimeRangeModel;
                        left: number;
                        width: number;
                    }]) => void) => () => void;
                    changed: (handler: (arg: [{
                        model: import("./core/timeRange").TimeRangeModel;
                        left: number;
                        width: number;
                    }]) => void) => () => void;
                };
                raise: {
                    clicked: (params_0: {
                        model: import("./core/timeRange").TimeRangeModel;
                    }) => void;
                    resized: (params_0: {
                        model: import("./core/timeRange").TimeRangeModel;
                        left: number;
                        width: number;
                    }) => void;
                    changed: (params_0: {
                        model: import("./core/timeRange").TimeRangeModel;
                        left: number;
                        width: number;
                    }) => void;
                };
            };
        };
        timeRangeFactory?: TimeRangeFactory;
        utils?: {
            getPositionByDate(date: number): number;
            getDateByPosition(x: any): number;
            roundTo(date: number): number;
        };
        refreshTimeRanges?: () => void;
        refreshTasks?: () => void;
        getRowContainer?: () => HTMLElement;
        selectTask?: (id: any) => void;
        unselectTasks?: () => void;
        scrollToRow?: (id: any, scrollBehavior?: string) => void;
        scrollToTask?: (id: any, scrollBehavior?: string) => void;
        updateTask?: (model: TaskModel) => void;
        updateTasks?: (models: TaskModel[]) => void;
        removeTask?: (taskId: PropertyKey) => void;
        removeTasks?: (taskIds: PropertyKey[]) => void;
        updateRow?: (model: RowModel) => void;
        updateRows?: (models: RowModel[]) => void;
        getRow?: (resourceId: any) => SvelteRow;
        getTask?: (id: any) => SvelteTask;
        getTasks?: (resourceId: any) => any;
        updateLayoutSync?: (_invalidateFull?: boolean) => void;
        updateLayout?: () => void;
        enableCreateTask?: boolean;
        onCreateTask?: (e: {
            from: number;
            to: number;
            resourceId: PropertyKey;
        }) => TaskModel;
        onCreatedTask?: (task: SvelteTask) => void;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type GanttProps = typeof __propDef.props;
export type GanttEvents = typeof __propDef.events;
export type GanttSlots = typeof __propDef.slots;
export default class Gantt extends SvelteComponentTyped<GanttProps, GanttEvents, GanttSlots> {
    get columnService(): {
        getColumnByDate: (date: number) => IColumn;
        getColumnByPosition: (x: number) => IColumn;
        getPositionByDate(date: number): number;
        getDateByPosition(x: number): number;
        roundTo(date: number): number;
    };
    get api(): {
        tasks: {
            on: {
                move: (handler: (arg: [TaskModel]) => void) => () => void;
                resize: (handler: (arg: [TaskModel]) => void) => () => void;
                select: (handler: (arg: [SvelteTask]) => void) => () => void;
                switchRow: (handler: (arg: [SvelteTask, SvelteRow, SvelteRow]) => void) => () => void;
                moveEnd: (handler: (arg: [TaskModel]) => void) => () => void;
                change: (handler: (arg: [{
                    task: SvelteTask;
                    sourceRow: SvelteRow;
                    targetRow: SvelteRow;
                    previousState: any;
                }]) => void) => () => void;
                changed: (handler: (arg: [{
                    task: SvelteTask;
                    sourceRow: SvelteRow;
                    targetRow: SvelteRow;
                    previousState: any;
                }]) => void) => () => void;
                dblclicked: (handler: (arg: [SvelteTask, MouseEvent]) => void) => () => void;
            };
            raise: {
                move: (params_0: TaskModel) => void;
                resize: (params_0: TaskModel) => void;
                select: (params_0: SvelteTask) => void;
                switchRow: (params_0: SvelteTask, params_1: SvelteRow, params_2: SvelteRow) => void;
                moveEnd: (params_0: TaskModel) => void;
                change: (params_0: {
                    task: SvelteTask;
                    sourceRow: SvelteRow;
                    targetRow: SvelteRow;
                    previousState: any;
                }) => void;
                changed: (params_0: {
                    task: SvelteTask;
                    sourceRow: SvelteRow;
                    targetRow: SvelteRow;
                    previousState: any;
                }) => void;
                dblclicked: (params_0: SvelteTask, params_1: MouseEvent) => void;
            };
        };
        gantt: {
            on: {
                viewChanged: (handler: (arg: []) => void) => () => void;
                dateSelected: (handler: (arg: [{
                    from: number;
                    to: number;
                }]) => void) => () => void;
            };
            raise: {
                viewChanged: () => void;
                dateSelected: (params_0: {
                    from: number;
                    to: number;
                }) => void;
            };
        };
        timeranges: {
            on: {
                clicked: (handler: (arg: [{
                    model: import("./core/timeRange").TimeRangeModel;
                }]) => void) => () => void;
                resized: (handler: (arg: [{
                    model: import("./core/timeRange").TimeRangeModel;
                    left: number;
                    width: number;
                }]) => void) => () => void;
                changed: (handler: (arg: [{
                    model: import("./core/timeRange").TimeRangeModel;
                    left: number;
                    width: number;
                }]) => void) => () => void;
            };
            raise: {
                clicked: (params_0: {
                    model: import("./core/timeRange").TimeRangeModel;
                }) => void;
                resized: (params_0: {
                    model: import("./core/timeRange").TimeRangeModel;
                    left: number;
                    width: number;
                }) => void;
                changed: (params_0: {
                    model: import("./core/timeRange").TimeRangeModel;
                    left: number;
                    width: number;
                }) => void;
            };
        };
    };
    get timeRangeFactory(): TimeRangeFactory;
    get utils(): {
        getPositionByDate(date: number): number;
        getDateByPosition(x: any): number;
        roundTo(date: number): number;
    };
    get refreshTimeRanges(): () => void;
    get refreshTasks(): () => void;
    get getRowContainer(): () => HTMLElement;
    get selectTask(): (id: any) => void;
    get unselectTasks(): () => void;
    get scrollToRow(): (id: any, scrollBehavior?: string) => void;
    get scrollToTask(): (id: any, scrollBehavior?: string) => void;
    get updateTask(): (model: TaskModel) => void;
    get updateTasks(): (models: TaskModel[]) => void;
    get removeTask(): (taskId: PropertyKey) => void;
    get removeTasks(): (taskIds: PropertyKey[]) => void;
    get updateRow(): (model: RowModel) => void;
    get updateRows(): (models: RowModel[]) => void;
    get getRow(): (resourceId: any) => SvelteRow;
    get getTask(): (id: any) => SvelteTask;
    get getTasks(): (resourceId: any) => any;
    get updateLayoutSync(): (_invalidateFull?: boolean) => void;
    get updateLayout(): () => void;
}
export {};
