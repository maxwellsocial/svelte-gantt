import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        paddingTop: any;
        dependencies?: any[];
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type GanttDependenciesProps = typeof __propDef.props;
export type GanttDependenciesEvents = typeof __propDef.events;
export type GanttDependenciesSlots = typeof __propDef.slots;
export default class GanttDependencies extends SvelteComponentTyped<GanttDependenciesProps, GanttDependenciesEvents, GanttDependenciesSlots> {
}
export {};
