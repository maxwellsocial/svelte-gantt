import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        header: any;
        ganttBodyColumns: any;
        ganttBodyUnit: any;
    };
    events: {
        dateSelected: CustomEvent<any>;
    } & {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type ColumnHeaderRowProps = typeof __propDef.props;
export type ColumnHeaderRowEvents = typeof __propDef.events;
export type ColumnHeaderRowSlots = typeof __propDef.slots;
export default class ColumnHeaderRow extends SvelteComponentTyped<ColumnHeaderRowProps, ColumnHeaderRowEvents, ColumnHeaderRowSlots> {
}
export {};
