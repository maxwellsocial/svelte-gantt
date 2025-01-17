import { SvelteComponentTyped } from "svelte";
import type { TableHeader } from './tableHeader';
import type { SvelteRow } from '../../core/row';
declare const __propDef: {
    props: {
        headers?: TableHeader[];
        row?: SvelteRow;
    };
    events: {
        rowCollapsed: CustomEvent<any>;
        rowExpanded: CustomEvent<any>;
    } & {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type TableRowProps = typeof __propDef.props;
export type TableRowEvents = typeof __propDef.events;
export type TableRowSlots = typeof __propDef.slots;
export default class TableRow extends SvelteComponentTyped<TableRowProps, TableRowEvents, TableRowSlots> {
}
export {};
