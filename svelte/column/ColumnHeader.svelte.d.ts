import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        /**
             * Container component for header rows
             */ headers: any;
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
export type ColumnHeaderProps = typeof __propDef.props;
export type ColumnHeaderEvents = typeof __propDef.events;
export type ColumnHeaderSlots = typeof __propDef.slots;
export default class ColumnHeader extends SvelteComponentTyped<ColumnHeaderProps, ColumnHeaderEvents, ColumnHeaderSlots> {
}
export {};
