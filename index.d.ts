interface Column {
    from: number;
    to: number;
    left: number;
    width: number;
    bgHighlightColor?: boolean;
    /**
     * Duration in milliseconds
     */
    duration: number;
}
type ColumnServiceParams = {
    readonly columns: Column[];
    readonly magnetDuration: number;
};
declare function createColumnService(params: ColumnServiceParams): {
    getColumnByDate: (date: number) => Column;
    getColumnByPosition: (x: number) => Column;
    getPositionByDate(date: number): number;
    getDateByPosition(x: number): number;
    /**
     * TODO: remove, currently unused
     * @param {number} date - Date
     * @returns {number} rounded date passed as parameter
     */
    roundTo(date: number): number;
};
type ColumnService = ReturnType<typeof createColumnService>;

interface RowModel {
    /**
     * Id of row, every resource needs to have a unique one
     */
    id: PropertyKey;
    label: string;
    classes?: string | string[];
    contentHtml?: string;
    height?: number;
    /**
     * enable dragging to row
     * @deprecated use draggable
     **/
    enableDragging?: boolean;
    /**
     * enable dragging to row
     **/
    draggable?: boolean;
    /**
     * enable resizing on row
     * @deprecated use resizable
     */
    enableResize?: boolean;
    /**
     * enable resizing on row
     */
    resizable?: boolean;
    /** Child rows in expandable tree */
    children?: RowModel[];
    expanded?: boolean;
    /** Content of row header, html string */
    headerHtml?: string;
    /**
     * Class of icon in row header
     * @deprecated
     **/
    iconClass?: string;
    /**
     * Url of image in row header
     * @deprecated
     **/
    imageSrc?: string;
}
interface SvelteRow {
    model: RowModel;
    y: number;
    height: number;
    hidden?: boolean;
    children?: SvelteRow[];
    allChildren?: SvelteRow[];
    parent?: SvelteRow;
    allParents?: SvelteRow[];
    childLevel?: number;
}

interface TaskModel {
    /** id of task, every task needs to have a unique one */
    id: PropertyKey;
    resourceId: PropertyKey;
    /** date task starts on */
    from: number;
    /** date task ends on */
    to: number;
    /**
     * completion %, indicated on task
     * @deprecated
     */
    amountDone?: number;
    /** css classes */
    classes?: string | string[];
    /** label of task */
    label?: string;
    /** html content of task, will override label */
    html?: string;
    /**
     * show button bar
     * @deprecated
     **/
    showButton?: boolean;
    /**
     * button classes, useful for fontawesome icons
     * @deprecated
     **/
    buttonClasses?: string | string[];
    /**
     * html content of button
     * @deprecated
     */
    buttonHtml?: string;
    /**
     * enable dragging of task
     * @deprecated use draggable
     **/
    enableDragging?: boolean;
    /**
     * enable dragging of task
     **/
    draggable?: boolean;
    /**
     * enable resizing of task
     * @deprecated use resizable
     */
    enableResize?: boolean;
    /**
     * enable resizing of task
     */
    resizable?: boolean;
    /**
     * label displayed below
     * @deprecated
     **/
    labelBottom?: string;
    type?: 'milestone' | 'task';
    stickyLabel?: boolean;
}
interface SvelteTask {
    model: TaskModel;
    left: number;
    top: number;
    width: number;
    height: number;
    reflected?: boolean;
    reflectedOnParent?: boolean;
    reflectedOnChild?: boolean;
    originalId?: PropertyKey;
}

interface TimeRangeModel {
    id: number;
    from: any;
    to: any;
    classes?: string | string[];
    label?: string;
    resizable?: boolean;
}
interface SvelteTimeRange {
    model: TimeRangeModel;
    left: number;
    width: number;
    resizing: boolean;
}
declare class TimeRangeFactory {
    columnService: ColumnService;
    constructor(columnService: ColumnService);
    create(model: TimeRangeModel): SvelteTimeRange;
}

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
type GanttApi = ReturnType<typeof createGanttApi>;

/**
 * Typings for Svelte components.
 *
 * Store typings were taken from 'svelte' npm package.
 */
interface ComponentOptions<T> {
    target: Element;
    anchor?: Element;
    props?: T;
    hydrate?: boolean;
    intro?: boolean;
}
interface Component<T = Record<string, any>> {
    constructor(options: ComponentOptions<T>): any;
    $set(props?: T): void;
    $on<T = any>(event: string, callback: (event: CustomEvent<T>) => void): () => void;
    $destroy(): void;
}
interface ComponentCreator<C extends Component<T>, T = Record<string, any>> {
    new (options: ComponentOptions<T>): C;
}
/**
 * Avoid installing svelte in projects
 */
declare module 'svelte/store' {
    interface Writable<T> extends Readable<T> {
        /**
         * Set value and inform subscribers.
         * @param value to set
         */
        set(value: T): void;
        /**
         * Update value using callback and inform subscribers.
         * @param updater callback
         */
        update(updater: (state: T) => T): void;
    }
    interface Readable<T> {
        /**
         * Subscribe on value changes.
         * @param run subscription callback
         * @param invalidate cleanup callback
         */
        subscribe(run: (value: T) => void, invalidate?: (value?: T) => void): () => void;
    }
}

interface SvelteGanttDateAdapter {
    roundTo(date: number, unit: string, offset: number): number;
    format(date: number, format: string): string;
}

type UtilsParams = Readonly<{
    from: number;
    to: number;
    width: number;
    magnetOffset: number;
    magnetUnit: string;
    magnetDuration: number;
    dateAdapter: SvelteGanttDateAdapter;
}>;
declare function createUtils(params: UtilsParams): {
    /**
     * Returns position of date on a line if from and to represent length of width
     * @param {*} date
     */
    getPositionByDate(date: number): number;
    getDateByPosition(x: any): number;
    roundTo(date: number): number;
};
type GanttUtils = ReturnType<typeof createUtils>;

interface DependencyModel {
    id: number;
    /** Id of dependent task */
    fromId: number;
    /** Id of dependency task */
    toId: number;
    /** Stroke color */
    stroke: string;
    /** Width of stroke */
    strokeWidth: number;
    /** Size of the arrow head */
    arrowSize: number;
}

declare const SvelteGanttDependencies: ComponentCreator<Component>;

interface TableHeader {
    /** Table column title */
    title: string;
    /** Table row property */
    property: string;
    width?: number;
    /** Result can be a html string */
    renderer?: (row: SvelteRow) => string;
    /** Type of header, can be `tree` */
    type?: 'tree' | any;
}

interface Header {
    unit: string;
    format: string;
    offset?: number;
    sticky?: boolean;
}
interface Zoom {
    headers: Header[];
    minWidth: number;
    fitWidth: boolean;
}
interface highlightedDurations {
    unit: string;
    fractions: number[];
}
type TaskButtonClickHandler = (task: TaskModel, event?: MouseEvent) => void;
type TaskContentTemplate = (task: TaskModel) => string;
interface SvelteGanttOptions {
    /**
     * Rows to load in the gantt
     */
    rows?: RowModel[];
    /**
     * Tasks that display in the gantt
     */
    tasks?: TaskModel[];
    /**
     * Timeranges that display in the gantt
     */
    timeRanges?: TimeRangeModel[];
    /**
     * Dependencies that display in the gantt, used with the SvelteGanttDependencies module
     */
    dependencies?: DependencyModel[];
    /** datetime timeline starts on, date */
    from?: number;
    /** datetime timeline ends on, date */
    to?: number;
    /** Minimum width of main gantt area in px */
    minWidth?: number;
    /** should timeline stretch width to fit */
    fitWidth?: boolean;
    /** minimum unit of time task date values will round to */
    magnetUnit?: string;
    /** amount of units task date values will round to */
    magnetOffset?: number;
    /** duration unit of columns */
    columnUnit?: string;
    /** duration width of column */
    columnOffset?: number;
    /** width of strokes seperating the columns in ganttbody */
    columnStrokeWidth?: number;
    /** color of strokes seperating the columns in ganttbody */
    columnStrokeColor?: string;
    /** object including a unit and fractions of that unit that should be highlighted eg. {unit: 'days', fractions: [0,6]} -> will highlight weekends.
     *  highlighting will only work correctly if highlighted unit is the same or a constant fraction of the column unit eg. days, hours, minutes in the above.
     */
    highlightedDurations?: highlightedDurations;
    /**
     * list of headers used for main gantt area
     *  - unit: time unit used, e.g. day will create a cell in the header for each day in the timeline
     *  - format: datetime format used for header cell label
     **/
    headers?: Header[];
    /**
     * List of zoom levels for gantt. Gantt cycles trough these parameters on ctrl+scroll.
     */
    zoomLevels?: Zoom[];
    /** height of a single row in px */
    rowHeight?: number;
    rowPadding?: number;
    /** modules used in gantt */
    ganttTableModules?: any[];
    ganttBodyModules?: any[];
    /**
     * When task is assigned to a child row display them on parent rows as well, used when rows are disabled as a tree.
     */
    reflectOnParentRows?: boolean;
    /**
     * When task is assigned to a parent row display them on child rows as well, used when rows are disabled as a tree.
     */
    reflectOnChildRows?: boolean;
    /** sets top level gantt class which can be used for styling */
    classes?: string | string[];
    /** width of handle for resizing task */
    resizeHandleWidth?: number;
    /** handler of button clicks */
    onTaskButtonClick?: TaskButtonClickHandler;
    /** task content factory function */
    taskContent?: TaskContentTemplate;
    /** task element hook */
    taskElementHook?: (node: HTMLElement, task: SvelteTask) => {
        update?(task: any): any;
        destroy?(): any;
    };
    /**
     * Width of table, used with SvelteGanttTable module
     */
    tableWidth?: number;
    /**
     * Headers of table, used with SvelteGanttTable module
     */
    tableHeaders?: TableHeader[];
}
interface SvelteGanttComponent extends Component<SvelteGanttOptions> {
    api: GanttApi;
    utils: GanttUtils;
    columnService: ColumnService;
    timeRangeFactory: TimeRangeFactory;
    refreshTasks(): any;
    refreshTimeRanges(): any;
    getRowContainer(): HTMLElement;
    selectTask(id: number): any;
    unselectTasks(): any;
    scrollToTask(id: number, scrollBehavior?: string): any;
    scrollToRow(id: number, scrollBehavior?: string): any;
    updateTask(model: TaskModel): any;
    updateTasks(models: TaskModel[]): any;
    updateRow(model: RowModel): any;
    updateRows(models: RowModel[]): any;
    getTask(id: any): SvelteTask;
    getTasks(resourceId: any): SvelteTask[];
    getRow(id: any): SvelteRow;
}

declare var SvelteGanttTable: ComponentCreator<Component>;

interface DragOptions {
    /** SvelteGantt this is binded to */
    gantt: SvelteGanttComponent;
    /** Creates a dragging indicator element */
    elementContent(): HTMLElement;
    /** Is currently being dragged */
    dragging: boolean;
    /** Is enabled */
    enabled: boolean;
    /** Success callback, when dragged over a row */
    onsuccess?(target: SvelteRow, date: number, gantt: SvelteGanttComponent): void;
    /** Fail callback, when dragged outside gantt */
    onfail?(): void;
}
declare class SvelteGanttExternal {
    draggable: {
        destroy(): void;
    };
    element: HTMLElement;
    options: DragOptions;
    constructor(node: HTMLElement, options: DragOptions);
    onDrag({ x, y }: {
        x: any;
        y: any;
    }): void;
    onDrop(event: {
        mouseEvent: MouseEvent;
    }): void;
}

/**
 * Date adapter that uses MomentJS
 */
declare class MomentSvelteGanttDateAdapter implements SvelteGanttDateAdapter {
    moment: any;
    constructor(moment: any);
    format(date: number, format: string): string;
    roundTo(date: number, unit: string, offset: number): number;
}

declare const SvelteGantt: ComponentCreator<SvelteGanttComponent, SvelteGanttOptions>;

export { MomentSvelteGanttDateAdapter, SvelteGantt, SvelteGanttComponent, SvelteGanttDependencies, SvelteGanttExternal, SvelteGanttOptions, SvelteGanttTable };
