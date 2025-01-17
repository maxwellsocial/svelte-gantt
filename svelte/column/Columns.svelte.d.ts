import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        /**
             * Container component for columns rendered as gantt body background
             */ columns: any;
        useCanvasColumns?: boolean;
        columnStrokeWidth: any;
        columnStrokeColor: any;
        columnDefaultColor?: string;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type ColumnsProps = typeof __propDef.props;
export type ColumnsEvents = typeof __propDef.events;
export type ColumnsSlots = typeof __propDef.slots;
export default class Columns extends SvelteComponentTyped<ColumnsProps, ColumnsEvents, ColumnsSlots> {
}
export {};
