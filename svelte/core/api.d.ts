import type { SvelteTask, TaskModel } from "./task";
import type { SvelteRow } from "./row";
import type { TimeRangeModel } from "./timeRange";
type EventController<T extends any[]> = [(handler: (arg: T) => void) => () => void, (...params: T) => void];
type EventsAndArgs<T = any> = {
    [Event in keyof T]: T[Event] extends any[] ? T[Event] : never;
};
type EventFeature<T extends EventsAndArgs> = {
    on: {
        [Event in keyof T]: EventController<T[Event]>[0];
    };
    raise: {
        [Event in keyof T]: EventController<T[Event]>[1];
    };
};
export declare function provideGanttApi(): {
    tasks: EventFeature<{
        move: [TaskModel];
        resize: [TaskModel];
        select: [SvelteTask];
        switchRow: [SvelteTask, SvelteRow, SvelteRow];
        moveEnd: [TaskModel];
        change: [{
            task: SvelteTask;
            sourceRow: SvelteRow;
            targetRow: SvelteRow;
            previousState: any;
        }];
        changed: [{
            task: SvelteTask;
            sourceRow: SvelteRow;
            targetRow: SvelteRow;
            previousState: any;
        }];
        dblclicked: [SvelteTask, MouseEvent];
    }>;
    gantt: EventFeature<{
        viewChanged: [];
        dateSelected: [{
            from: number;
            to: number;
        }];
    }>;
    timeranges: EventFeature<{
        clicked: [{
            model: TimeRangeModel;
        }];
        resized: [{
            model: TimeRangeModel;
            left: number;
            width: number;
        }];
        changed: [{
            model: TimeRangeModel;
            left: number;
            width: number;
        }];
    }>;
};
declare function createGanttApi(): {
    tasks: EventFeature<{
        move: [TaskModel];
        resize: [TaskModel];
        select: [SvelteTask];
        switchRow: [SvelteTask, SvelteRow, SvelteRow];
        moveEnd: [TaskModel];
        change: [{
            task: SvelteTask;
            sourceRow: SvelteRow;
            targetRow: SvelteRow;
            previousState: any;
        }];
        changed: [{
            task: SvelteTask;
            sourceRow: SvelteRow;
            targetRow: SvelteRow;
            previousState: any;
        }];
        dblclicked: [SvelteTask, MouseEvent];
    }>;
    gantt: EventFeature<{
        viewChanged: [];
        dateSelected: [{
            from: number;
            to: number;
        }];
    }>;
    timeranges: EventFeature<{
        clicked: [{
            model: TimeRangeModel;
        }];
        resized: [{
            model: TimeRangeModel;
            left: number;
            width: number;
        }];
        changed: [{
            model: TimeRangeModel;
            left: number;
            width: number;
        }];
    }>;
};
export type GanttApi = ReturnType<typeof createGanttApi>;
export declare function useGanttApi(): GanttApi;
export {};
