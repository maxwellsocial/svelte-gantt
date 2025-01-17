import { SvelteComponentTyped } from "svelte";
export declare const type = "table";
import type { TableHeader } from './tableHeader';
import type { SvelteRow } from '../../core/row';
declare const __propDef: {
    props: {
        tableWidth: any;
        paddingTop: any;
        rowContainerHeight: any;
        visibleRows: SvelteRow[];
        tableHeaders?: TableHeader[];
    };
    events: {
        init: CustomEvent<any>;
    } & {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type TableProps = typeof __propDef.props;
export type TableEvents = typeof __propDef.events;
export type TableSlots = typeof __propDef.slots;
export default class Table extends SvelteComponentTyped<TableProps, TableEvents, TableSlots> {
}
export {};
