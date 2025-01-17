import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        left: any;
        width: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type ColumnProps = typeof __propDef.props;
export type ColumnEvents = typeof __propDef.events;
export type ColumnSlots = typeof __propDef.slots;
export default class Column extends SvelteComponentTyped<ColumnProps, ColumnEvents, ColumnSlots> {
}
export {};
